import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// Non-2xx responses make Stripe retry the event and surface it as failed in the
// dashboard, so anything that prevents fulfillment must not answer 200.
function respond(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return respond({ error: 'Method not allowed' }, 405);
  }

  try {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecret || !stripeWebhookSecret) {
      console.error('Missing Stripe secrets — STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set');
      return respond({ error: 'Not configured' }, 500);
    }

    const stripe = new Stripe(stripeSecret, {
      appInfo: { name: 'Bolt Integration', version: '1.0.0' },
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No stripe-signature header found');
      return respond({ error: 'Missing signature' }, 400);
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error?.message}`);
      return respond({ error: 'Invalid signature' }, 400);
    }

    console.log(`Received event: ${event.type} (id: ${event.id})`);

    const handled = await handleEvent(event, supabase);
    if (!handled) {
      return respond({ error: 'Processing failed' }, 500);
    }

    return respond({ received: true }, 200);
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return respond({ error: 'Processing failed' }, 500);
  }
});

async function handleEvent(event: Stripe.Event, supabase: ReturnType<typeof createClient>): Promise<boolean> {
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    return true;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const resultId = session.metadata?.result_id;

  // The Stripe account also sells unrelated products; only checkouts started by this app carry a result_id.
  // Shadow Map add-ons bought elsewhere are picked up by reconcile-payments.
  if (session.mode !== 'payment' || !resultId) return true;

  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    console.info(`Checkout ${session.id} not paid yet (${session.payment_status}), waiting for async payment`);
    return true;
  }

  const { error: orderError } = await supabase.from('stripe_orders').upsert(
    {
      checkout_session_id: session.id,
      payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
      customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
      amount_subtotal: session.amount_subtotal ?? 0,
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      payment_status: session.payment_status,
      status: 'completed',
    },
    { onConflict: 'checkout_session_id', ignoreDuplicates: true },
  );

  if (orderError) {
    console.error('Error recording order:', orderError);
    return false;
  }

  const fulfillResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/fulfill-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ resultId }),
  });

  if (!fulfillResponse.ok) {
    console.error(`Fulfillment handoff failed for ${session.id}:`, fulfillResponse.status, await fulfillResponse.text());
    return false;
  }

  console.info(`Fulfillment handed off for checkout ${session.id} (amount: ${session.amount_total})`);
  return true;
}
