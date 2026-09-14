import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
          metadata,
          customer_details,
        } = stripeData as Stripe.Checkout.Session;

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);

        // Trigger the Shadow Map report/PDF pipeline
        const resultId = metadata?.result_id;
        const customerEmail = customer_details?.email || metadata?.email;

        if (resultId || customerEmail) {
          await triggerShadowMapPipeline(resultId, customerEmail);
        }
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

async function triggerShadowMapPipeline(resultId?: string, email?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  let query = supabase
    .from('shadow_work_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (resultId) {
    query = query.eq('id', resultId);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    console.error('No resultId or email to match payment');
    return;
  }

  const { data: record, error: fetchError } = await query.maybeSingle();

  if (fetchError || !record) {
    console.error('Could not find shadow_work_results record:', resultId || email, fetchError);
    return;
  }

  console.log('Found record:', record.id, 'for email:', record.email);

  const { error: updateError } = await supabase
    .from('shadow_work_results')
    .update({ has_purchased: true })
    .eq('id', record.id);

  if (updateError) {
    console.error('Failed to update has_purchased:', updateError);
    return;
  }

  console.log('Marked has_purchased = true for record:', record.id);

  // Generate the deep dive AI report
  console.log('Generating deep dive report...');
  const reportResponse = await fetch(
    `${supabaseUrl}/functions/v1/generate-report`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        name: record.name,
        chironSign: record.chiron_sign,
        chironHouse: record.chiron_house,
        chironDegree: record.chiron_degree,
      }),
    }
  );

  if (!reportResponse.ok) {
    const errText = await reportResponse.text();
    console.error('Report generation failed:', errText);
    await supabase
      .from('shadow_work_results')
      .update({
        ai_report_status: 'error',
        ai_report_error: `Report generation failed: ${errText.slice(0, 500)}`,
      })
      .eq('id', record.id);
    return;
  }

  const reportData = await reportResponse.json();
  console.log('Report generated, length:', reportData.report?.length, 'status:', reportData.status);

  await supabase
    .from('shadow_work_results')
    .update({
      ai_report: reportData.report,
      ai_report_status: reportData.status || 'completed',
      ai_report_error: null,
    })
    .eq('id', record.id);

  // Generate PDF
  console.log('Generating PDF...');
  const pdfResponse = await fetch(
    `${supabaseUrl}/functions/v1/generate-pdf`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        name: record.name,
        email: record.email,
        chironSign: record.chiron_sign,
        chironHouse: record.chiron_house,
        chironDegree: record.chiron_degree,
        shadowId: record.shadow_id,
        report: reportData.report,
      }),
    }
  );

  if (!pdfResponse.ok) {
    const errText = await pdfResponse.text();
    console.error('PDF generation failed:', errText);
    return;
  }

  const pdfData = await pdfResponse.json();
  console.log('PDF generated successfully');

  // Send to n8n webhook for email delivery
  console.log('Sending PDF to delivery webhook...');
  const webhookResponse = await fetch(
    `${supabaseUrl}/functions/v1/send-pdf-webhook`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        name: record.name,
        email: record.email,
        chironSign: record.chiron_sign,
        chironHouse: record.chiron_house,
        chironDegree: record.chiron_degree,
        shadowId: record.shadow_id,
        pdfBase64: pdfData.pdfBase64,
      }),
    }
  );

  if (!webhookResponse.ok) {
    const errText = await webhookResponse.text();
    console.error('Webhook delivery failed:', errText);
    return;
  }

  console.log('Full pipeline complete for:', record.email);
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}