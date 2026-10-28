/*
# Harden Stripe order recording

1. Modified Tables
- `stripe_orders`
  - `customer_id` is now optional. Some Stripe checkouts complete without a customer record;
    previously those payments were rejected and the buyer was never marked as paid.
  - New unique index on `checkout_session_id` so the same Stripe checkout can only be recorded once,
    even when both the Stripe notification and the buyer's return to the site confirm it at the same time.

2. Security
- No policy or grant changes. The table is only written by server-side functions.

3. Notes
- No data is removed or changed. Existing rows were checked and contain no duplicate checkout sessions.
*/

ALTER TABLE stripe_orders ALTER COLUMN customer_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stripe_orders_checkout_session_id_key
  ON stripe_orders (checkout_session_id);
