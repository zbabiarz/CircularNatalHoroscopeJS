import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { sessionId, resultId } = await req.json();

    if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_') || typeof resultId !== 'string' || !resultId) {
      return json({ error: 'Invalid request' }, 400);
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      appInfo: { name: 'Shadow Map Checkout', version: '1.0.0' },
    });

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error: any) {
      console.error(`Could not retrieve session ${sessionId}: ${error?.message}`);
      return json({ error: 'Checkout not found' }, 404);
    }

    if (session.metadata?.result_id !== resultId) {
      return json({ error: 'Checkout not found' }, 404);
    }

    if (session.mode !== 'payment' || (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required')) {
      return json({ status: 'not_paid' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

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
    }

    const fulfillResponse = await fetch(`${supabaseUrl}/functions/v1/fulfill-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ resultId }),
    });

    if (!fulfillResponse.ok) {
      console.error(`Fulfillment failed for ${session.id}:`, fulfillResponse.status, await fulfillResponse.text());
      return json({ error: 'Could not confirm purchase' }, 500);
    }

    console.log(`Confirmed checkout ${session.id} on buyer return`);
    return json({ status: 'confirmed' });
  } catch (error: any) {
    console.error('confirm-checkout error:', error);
    return json({ error: 'Could not confirm purchase' }, 500);
  }
});
