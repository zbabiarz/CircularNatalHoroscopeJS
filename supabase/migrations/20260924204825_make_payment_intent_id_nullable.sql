/*
  # Make payment_intent_id nullable for 100% coupon orders

  1. Changes
    - Alter `stripe_orders.payment_intent_id` from NOT NULL to NULLABLE
  2. Reason
    - When a 100% discount coupon is applied, Stripe does not create a
      PaymentIntent, so the value is null. The NOT NULL constraint was
      causing the webhook to fail silently, blocking the report/PDF pipeline
      for free orders.
*/

ALTER TABLE stripe_orders ALTER COLUMN payment_intent_id DROP NOT NULL;
