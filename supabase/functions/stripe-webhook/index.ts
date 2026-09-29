import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecret || !stripeWebhookSecret) {
      console.error('Missing Stripe secrets — STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set');
      return new Response('OK', { status: 200 });
    }

    const stripe = new Stripe(stripeSecret, {
      appInfo: {
        name: 'Bolt Integration',
        version: '1.0.0',
      },
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No stripe-signature header found');
      return new Response('OK', { status: 200 });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error?.message}`);
      return new Response('OK', { status: 200 });
    }

    console.log(`Received event: ${event.type} (id: ${event.id})`);

    EdgeRuntime.waitUntil(handleEvent(event, stripe, supabase));

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleEvent(event: Stripe.Event, stripe: Stripe, supabase: ReturnType<typeof createClient>) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) return;
  if (!('customer' in stripeData)) return;

  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
    return;
  }

  let isSubscription = true;

  if (event.type === 'checkout.session.completed') {
    const { mode } = stripeData as Stripe.Checkout.Session;
    isSubscription = mode === 'subscription';
    console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
  }

  const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

  if (isSubscription) {
    console.info(`Starting subscription sync for customer: ${customerId}`);
    await syncCustomerFromStripe(customerId, stripe, supabase);
  } else if (mode === 'payment' && payment_status === 'paid') {
    try {
      const {
        id: checkout_session_id,
        payment_intent,
        amount_subtotal,
        amount_total,
        currency,
        metadata,
        customer_details,
      } = stripeData as Stripe.Checkout.Session;

      const { data: existingOrder } = await supabase
        .from('stripe_orders')
        .select('id')
        .eq('checkout_session_id', checkout_session_id)
        .maybeSingle();

      if (existingOrder) {
        console.info(`Order already processed for session: ${checkout_session_id}, skipping (idempotent)`);
        const resultId = metadata?.result_id;
        const customerEmail = customer_details?.email || metadata?.email;
        if (resultId || customerEmail) {
          const { data: record } = await supabase
            .from('shadow_work_results')
            .select('id, ai_report_status')
            .eq(resultId ? 'id' : 'email', resultId || customerEmail)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (record && record.ai_report_status !== 'completed') {
            console.info(`Report not completed for ${checkout_session_id}, re-triggering pipeline`);
            await triggerShadowMapPipeline(resultId, customerEmail, supabase);
          }
        }
        return;
      }

      const { error: orderError } = await supabase.from('stripe_orders').insert({
        checkout_session_id,
        payment_intent_id: payment_intent ?? null,
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
      console.info(`Successfully processed one-time payment for session: ${checkout_session_id} (amount: ${amount_total})`);

      const resultId = metadata?.result_id;
      const customerEmail = customer_details?.email || metadata?.email;

      if (resultId || customerEmail) {
        await triggerShadowMapPipeline(resultId, customerEmail, supabase);
      }
    } catch (error) {
      console.error('Error processing one-time payment:', error);
    }
  }
}

async function triggerShadowMapPipeline(resultId: string | undefined, email: string | undefined, supabase: ReturnType<typeof createClient>) {
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

  if (record.ai_report && record.ai_report.length > 5000 && record.ai_report_status === 'completed') {
    console.log('Report already completed and delivered, skipping regeneration');
    return;
  }

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
        chironDegree: Number(record.chiron_degree) || 0,
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

    try {
      await fetch(
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
            shadowId: record.shadow_id,
            resultId: record.id,
            type: 'report_generation_failed',
            error: `Report generation HTTP error: ${reportResponse.status}`,
          }),
        }
      );
    } catch (_) { /* best-effort */ }
    return;
  }

  let reportData = await reportResponse.json();
  console.log('Report generated, length:', reportData.report?.length, 'status:', reportData.status);

  if (!reportData.isValid || (reportData.report?.length ?? 0) < 1000) {
    console.warn('Report incomplete or refused, retrying once...');
    const retryResponse = await fetch(
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
          chironDegree: Number(record.chiron_degree) || 0,
        }),
      }
    );

    if (retryResponse.ok) {
      const retryData = await retryResponse.json();
      console.log('Retry report length:', retryData.report?.length, 'status:', retryData.status);
      if ((retryData.report?.length ?? 0) > (reportData.report?.length ?? 0)) {
        reportData = retryData;
      }
    } else {
      console.error('Retry also failed:', retryResponse.status);
    }
  }

  if (!reportData.report || reportData.report.length < 5000) {
    console.error('Report is too short or empty after retry, aborting pipeline');
    await supabase
      .from('shadow_work_results')
      .update({
        ai_report: reportData.report || null,
        ai_report_status: 'error',
        ai_report_error: `AI did not produce a usable report (length: ${reportData.report?.length ?? 0}, status: ${reportData.status ?? 'unknown'})`,
      })
      .eq('id', record.id);

    // Notify n8n so the admin knows a paid customer's report failed
    try {
      await fetch(
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
            chironDegree: Number(record.chiron_degree) || 0,
            shadowId: record.shadow_id,
            resultId: record.id,
            type: 'report_generation_failed',
            error: `AI report too short (${reportData.report?.length ?? 0} chars). Customer paid but report could not be generated.`,
          }),
        }
      );
      console.log('Failure notification sent to webhook');
    } catch (webhookErr) {
      console.error('Failed to send failure notification:', webhookErr);
    }
    return;
  }

  if (!reportData.isValid) {
    console.warn(`Report has minor voice flags (status: ${reportData.status}) but is long enough (${reportData.report.length} chars) — proceeding with delivery`);
  }

  await supabase
    .from('shadow_work_results')
    .update({
      ai_report: reportData.report,
      ai_report_status: reportData.status || 'completed',
      ai_report_error: null,
    })
    .eq('id', record.id);

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
        chironDegree: Number(record.chiron_degree) || 0,
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
        chironDegree: Number(record.chiron_degree) || 0,
        shadowId: record.shadow_id,
        resultId: record.id,
        pdfUrl: pdfData.publicUrl,
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

async function syncCustomerFromStripe(customerId: string, stripe: Stripe, supabase: ReturnType<typeof createClient>) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

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

    const subscription = subscriptions.data[0];

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
