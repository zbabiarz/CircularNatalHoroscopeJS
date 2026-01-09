/*
  # Add AI Report Columns to Shadow Work Results

  1. Changes
    - Add `ai_report` column to store the full AI-generated report
    - Add `ai_report_status` column to track generation status (pending, completed, failed, partial)
    - Add `ai_report_error` column to store error messages if generation fails
    - Add index on (email, created_at) for efficient user history queries

  2. Purpose
    - Persist AI reports in database instead of relying on localStorage
    - Track report generation status for better error handling
    - Enable polling mechanism to wait for report completion
    - Maintain full history of all user submissions
*/

-- Add ai_report column to store the full generated report
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shadow_work_results' AND column_name = 'ai_report'
  ) THEN
    ALTER TABLE shadow_work_results ADD COLUMN ai_report text;
  END IF;
END $$;

-- Add ai_report_status column to track generation status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shadow_work_results' AND column_name = 'ai_report_status'
  ) THEN
    ALTER TABLE shadow_work_results ADD COLUMN ai_report_status text DEFAULT 'pending';
  END IF;
END $$;

-- Add ai_report_error column to store error messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shadow_work_results' AND column_name = 'ai_report_error'
  ) THEN
    ALTER TABLE shadow_work_results ADD COLUMN ai_report_error text;
  END IF;
END $$;

-- Add composite index for efficient user history queries
CREATE INDEX IF NOT EXISTS idx_shadow_work_results_email_created_at
  ON shadow_work_results(email, created_at DESC);

-- Add index on status for filtering pending/failed reports
CREATE INDEX IF NOT EXISTS idx_shadow_work_results_status
  ON shadow_work_results(ai_report_status);
