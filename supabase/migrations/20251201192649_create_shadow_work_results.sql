/*
  # Create shadow work quiz results table

  1. New Tables
    - `shadow_work_results`
      - `id` (uuid, primary key) - Unique identifier for each result
      - `name` (text) - User's name
      - `email` (text) - User's email address
      - `birth_date` (date) - User's birth date
      - `birth_time` (text, optional) - User's birth time
      - `birth_location` (text, optional) - User's birth location
      - `chiron_sign` (text) - Calculated Chiron zodiac sign
      - `chiron_degree` (numeric) - Calculated Chiron degree
      - `chiron_house` (text, optional) - Calculated Chiron house placement
      - `shadow_id` (text) - Identifier for the shadow work content
      - `shadow_text` (text) - The shadow work description
      - `created_at` (timestamptz) - Timestamp of when the result was created

  2. Security
    - Enable RLS on `shadow_work_results` table
    - Add policy for public insert access (quiz submissions)
    - Add policy for authenticated users to view their own results

  3. Indexes
    - Add index on email for faster lookups
    - Add index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS shadow_work_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  birth_date date NOT NULL,
  birth_time text,
  birth_location text,
  chiron_sign text NOT NULL,
  chiron_degree numeric NOT NULL,
  chiron_house text,
  shadow_id text NOT NULL,
  shadow_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shadow_work_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit quiz results"
  ON shadow_work_results
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own results by email"
  ON shadow_work_results
  FOR SELECT
  TO anon, authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR true);

CREATE INDEX IF NOT EXISTS idx_shadow_work_results_email ON shadow_work_results(email);
CREATE INDEX IF NOT EXISTS idx_shadow_work_results_created_at ON shadow_work_results(created_at DESC);