/*
# Automatic Stripe payment reconciliation

1. What this does
- Turns on the database scheduler (pg_cron) and outbound web requests (pg_net).
- Stores a random private key in the Supabase vault that only the scheduled job uses to call the
  `reconcile-payments` function.
- Adds `reconcile_token_ok(p_token)` which checks that key. Only the server role can call it.
- Schedules `reconcile-payments` every 15 minutes. It compares the last 3 days of Stripe payments
  with app records and delivers any paid report that was missed.

2. Security
- `reconcile_token_ok` is SECURITY DEFINER with EXECUTE revoked from PUBLIC, anon and authenticated;
  only service_role may run it.
- The key lives in vault.secrets and is never exposed to the browser.

3. Notes
- No tables or data are changed.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'reconcile_token') THEN
    PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'reconcile_token');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.reconcile_token_ok(p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets
    WHERE name = 'reconcile_token'
      AND p_token IS NOT NULL
      AND decrypted_secret = p_token
  );
$$;

REVOKE EXECUTE ON FUNCTION public.reconcile_token_ok(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_token_ok(text) TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reconcile-stripe-payments') THEN
    PERFORM cron.unschedule('reconcile-stripe-payments');
  END IF;
END $$;

SELECT cron.schedule(
  'reconcile-stripe-payments',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://czuvjfyyidzzcskoksds.supabase.co/functions/v1/reconcile-payments',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'reconcile_token'),
      'days', 3,
      'apply', true
    ),
    timeout_milliseconds := 60000
  );
  $cron$
);
