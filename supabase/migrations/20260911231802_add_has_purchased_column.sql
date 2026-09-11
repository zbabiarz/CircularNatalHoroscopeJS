/*
  # Add has_purchased column to shadow_work_results

  1. Changes
    - Add `has_purchased` boolean column to `shadow_work_results` table
    - Defaults to false for all existing and new rows
    - Used to track whether a user has purchased the full Shadow Map report via Stripe

  2. Notes
    - Non-destructive: adds a column with a default, no data loss
    - The Stripe webhook will flip this to true after successful payment
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shadow_work_results' AND column_name = 'has_purchased'
  ) THEN
    ALTER TABLE shadow_work_results ADD COLUMN has_purchased boolean NOT NULL DEFAULT false;
  END IF;
END $$;
