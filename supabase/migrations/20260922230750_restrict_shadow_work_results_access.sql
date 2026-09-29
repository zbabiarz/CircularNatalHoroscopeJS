/*
  # Lock down direct access to quiz submissions

  1. Security
    - Remove the policy that let ANY signed-in account read every submission
      (`authenticated_select_shadow_work_results` used `USING (true)`).
    - Revoke SELECT, UPDATE and DELETE on `shadow_work_results` from anon and
      authenticated. The app never reads or writes the table directly: results are
      read through the `get_result` security-definer function and the admin portal
      reads through the passcode-gated admin functions.
    - Replace the blanket INSERT privilege with a column list covering only the
      fields the public quiz form submits, so a crafted request can no longer set
      `has_purchased`, `ai_report`, `ai_report_status` or `ai_report_error`.
    - Revoke the unused write privileges on the Stripe bookkeeping tables, which
      are written only by the Stripe webhook using the service role.

  2. Notes
    - No data is modified and no column or table is dropped.
*/

DROP POLICY IF EXISTS "authenticated_select_shadow_work_results" ON shadow_work_results;

REVOKE SELECT, UPDATE, DELETE, INSERT ON shadow_work_results FROM anon, authenticated;

GRANT INSERT (
  id,
  name,
  email,
  birth_date,
  birth_time,
  birth_location,
  chiron_sign,
  chiron_degree,
  chiron_house,
  shadow_id,
  shadow_text
) ON shadow_work_results TO anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON stripe_customers FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON stripe_orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON stripe_subscriptions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON stripe_user_orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON stripe_user_subscriptions FROM anon, authenticated;
