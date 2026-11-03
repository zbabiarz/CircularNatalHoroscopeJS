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

type Payment = {
  stripeId: string;
  checkoutSessionId: string | null;
  source: 'checkout' | 'order_form';
  createdAt: string;
  amount: number;
  email: string | null;
  resultId: string | null;
  description: string | null;
  session: Stripe.Checkout.Session | null;
};

type Supabase = ReturnType<typeof createClient>;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { passcode, token, days, apply } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (!(await isAuthorized(supabase, passcode, token))) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const lookbackDays = Math.min(Math.max(Number(days) || 14, 1), 90);
    const since = Math.floor(Date.now() / 1000) - lookbackDays * 86400;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      appInfo: { name: 'Shadow Map Reconcile', version: '1.0.0' },
    });

    const payments = await collectPayments(stripe, since);
    const results = [];

    for (const payment of payments) {
      const record = await findRecord(supabase, payment);
      const ageMinutes = (Date.now() - new Date(payment.createdAt).getTime()) / 60000;

      let status: string;
      if (!record) status = 'no_matching_quiz';
      else if (!record.has_purchased) status = 'missed';
      else if (record.ai_report_status !== 'completed' && ageMinutes > 60) status = 'paid_report_not_delivered';
      else status = 'ok';

      let action: string | null = null;
      // Skip very recent payments so the normal Stripe notification gets the first chance.
      if (apply && status === 'missed' && ageMinutes > 5) {
        action = await fulfill(supabase, supabaseUrl, serviceKey, payment, record.id);
      }

      results.push({
        stripeId: payment.stripeId,
        source: payment.source,
        paidAt: payment.createdAt,
        amount: payment.amount / 100,
        email: payment.email,
        description: payment.description,
        resultId: record?.id ?? payment.resultId,
        name: record?.name ?? null,
        reportStatus: record?.ai_report_status ?? null,
        status,
        action,
      });
    }

    const problems = results.filter((r) => r.status !== 'ok');
    if (problems.length > 0) {
      console.warn('Reconcile found issues:', JSON.stringify(problems));
    }
    console.log(`Reconciled ${results.length} payments over ${lookbackDays} days; ${problems.length} need attention`);

    return json({ checked: results.length, problems: problems.length, results });
  } catch (error: any) {
    console.error('reconcile-payments error:', error);
    return json({ error: 'Reconcile failed' }, 500);
  }
});

async function isAuthorized(supabase: Supabase, passcode: unknown, token: unknown) {
  if (typeof passcode === 'string' && passcode) {
    const { data } = await supabase.rpc('admin_passcode_ok', { p_passcode: passcode });
    if (data === true) return true;
  }
  if (typeof token === 'string' && token) {
    const { data } = await supabase.rpc('reconcile_token_ok', { p_token: token });
    if (data === true) return true;
  }
  return false;
}

async function collectPayments(stripe: Stripe, since: number): Promise<Payment[]> {
  const payments: Payment[] = [];
  const coveredIntents = new Set<string>();

  for await (const session of stripe.checkout.sessions.list({ created: { gte: since }, status: 'complete', limit: 100 })) {
    if (session.mode !== 'payment') continue;
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') continue;

    if (!session.metadata?.result_id) continue;

    const intentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
    if (intentId) coveredIntents.add(intentId);

    payments.push({
      stripeId: session.id,
      checkoutSessionId: session.id,
      source: 'checkout',
      createdAt: new Date(session.created * 1000).toISOString(),
      amount: session.amount_total ?? 0,
      email: session.customer_details?.email ?? session.metadata?.email ?? null,
      resultId: session.metadata.result_id,
      description: null,
      session,
    });
  }

  // Payments made outside the app (e.g. the challenge order form's Shadow Map add-on) never send a checkout notice.
  // Only Shadow Map purchases count; the same Stripe account also sells unrelated products.
  for await (const intent of stripe.paymentIntents.list({
    created: { gte: since },
    limit: 100,
    expand: ['data.latest_charge', 'data.customer'],
  })) {
    if (intent.status !== 'succeeded' || coveredIntents.has(intent.id)) continue;

    const charge = intent.latest_charge && typeof intent.latest_charge !== 'string' ? intent.latest_charge : null;
    const description = intent.description ?? charge?.description ?? null;
    if (!isShadowMapProduct(description)) continue;

    const customer = intent.customer && typeof intent.customer !== 'string' && !('deleted' in intent.customer) ? intent.customer : null;

    payments.push({
      stripeId: intent.id,
      checkoutSessionId: null,
      source: 'order_form',
      createdAt: new Date(intent.created * 1000).toISOString(),
      amount: intent.amount_received ?? intent.amount,
      email: intent.receipt_email ?? charge?.billing_details?.email ?? customer?.email ?? null,
      resultId: intent.metadata?.result_id ?? null,
      description,
      session: null,
    });
  }

  return payments;
}

function isShadowMapProduct(description: string | null) {
  return !!description && /shadow\s*map/i.test(description);
}

async function findRecord(supabase: Supabase, payment: Payment) {
  if (payment.resultId) {
    const { data } = await supabase
      .from('shadow_work_results')
      .select('id, name, email, created_at, has_purchased, ai_report_status')
      .eq('id', payment.resultId)
      .maybeSingle();
    if (data) return data;
  }

  if (!payment.email) return null;

  const email = payment.email.trim().toLowerCase();
  const { data } = await supabase
    .from('shadow_work_results')
    .select('id, name, email, created_at, has_purchased, ai_report_status')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(20);

  const matches = (data ?? []).filter((r: any) => (r.email ?? '').trim().toLowerCase() === email);
  if (matches.length === 0) return null;

  // Someone who retook the quiz should get the reading they had just before paying.
  const paidAt = new Date(payment.createdAt).getTime() + 5 * 60000;
  return matches.find((r: any) => new Date(r.created_at).getTime() <= paidAt) ?? matches[0];
}

async function fulfill(supabase: Supabase, supabaseUrl: string, serviceKey: string, payment: Payment, resultId: string) {
  const session = payment.session;
  if (session) {
    const { error } = await supabase.from('stripe_orders').upsert(
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
    if (error) console.error('Error recording order:', error);
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/fulfill-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
    body: JSON.stringify({ resultId }),
  });

  if (!response.ok) {
    console.error(`Fulfillment failed for ${payment.stripeId}:`, response.status, await response.text());
    return 'fulfill_failed';
  }
  console.log(`Recovered missed payment ${payment.stripeId} for result ${resultId}`);
  return 'fulfilled';
}
