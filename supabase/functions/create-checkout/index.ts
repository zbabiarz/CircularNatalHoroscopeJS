import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';

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
    const { email, resultId, name } = await req.json();

    if (!email || !resultId) {
      return new Response(
        JSON.stringify({ error: 'Missing email or resultId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const origin = req.headers.get('origin') || 'https://lovelightandblackholes.com';

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
      metadata: {
        result_id: resultId,
        email: email,
        name: name || '',
      },
      success_url: `${origin}/result?checkout=success&result_id=${resultId}`,
      cancel_url: `${origin}/result?checkout=cancelled&result_id=${resultId}`,
    });

    console.log(`Created checkout session ${session.id} for result ${resultId}, email ${email}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
