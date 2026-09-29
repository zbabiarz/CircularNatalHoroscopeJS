import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Shadow Map Checkout',
    version: '1.0.0',
  },
});

const PRODUCT_ID = 'prod_VF4Gq1OPQSHlOR';
// Force redeploy to ensure success_url includes /result path

const ALLOWED_ORIGINS = [
  'https://shadow.lovelightandblackholes.com',
  'https://lovelightandblackholes.com',
  'https://www.lovelightandblackholes.com',
];
const DEFAULT_ORIGIN = 'https://shadow.lovelightandblackholes.com';

function resolveOrigin(req: Request): string {
  const origin = req.headers.get('origin') ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  try {
    const url = new URL(origin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return origin;
  } catch {
    // not a valid URL, fall through to the default
  }
  return DEFAULT_ORIGIN;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { resultId } = await req.json();

    if (!resultId || typeof resultId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing resultId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The buyer's email and name are never taken from the request body: a caller
    // could otherwise point somebody else's purchase at an address they control.
    const { data: result, error: lookupError } = await supabase
      .from('shadow_work_results')
      .select('email, name')
      .eq('id', resultId)
      .maybeSingle();

    if (lookupError) {
      console.error('Result lookup failed:', lookupError);
      return new Response(
        JSON.stringify({ error: 'Could not start checkout' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!result || !result.email) {
      return new Response(
        JSON.stringify({ error: 'Result not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = result.email as string;
    const name = (result.name as string | null) ?? '';

    const product = await stripe.products.retrieve(PRODUCT_ID);

    let priceId = product.default_price as string | null;

    if (!priceId) {
      const prices = await stripe.prices.list({
        product: PRODUCT_ID,
        active: true,
        limit: 1,
      });

      if (prices.data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No active price found for product' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      priceId = prices.data[0].id;
    }

    const origin = resolveOrigin(req);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_creation: 'always',
      customer_email: email,
      allow_promotion_codes: true,
      payment_intent_data: {
        description: 'The Shadow Map ($37)',
        metadata: {
          product: 'The Shadow Map',
          price: '37',
        },
      },
      metadata: {
        result_id: resultId,
        email: email,
        name: name,
        product: 'The Shadow Map',
      },
      success_url: `${origin}/result?checkout=success&resultId=${resultId}`,
      cancel_url: `${origin}/result?checkout=cancelled&resultId=${resultId}`,
    });

    console.log(`Created checkout session ${session.id} for result ${resultId}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(`Checkout error: ${error?.message}`);
    return new Response(
      JSON.stringify({ error: 'Could not start checkout' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
