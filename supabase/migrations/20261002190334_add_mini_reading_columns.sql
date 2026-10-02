/*
  # Store the AI-written free mini reading

  1. Modified Tables
    - `shadow_work_results`
      - `mini_reading` (jsonb, nullable): the personalized free reading (archetype, opening, pattern, money, trap)
      - `mini_reading_status` (text, nullable): null = not started, 'generating', 'completed', 'failed'
      - `mini_reading_error` (text, nullable): last error message for debugging
  2. Functions
    - `get_result(uuid)` now also returns `mini_reading` and `mini_reading_status` so the results page
      can show a saved reading. Email is still not exposed.
  3. Security
    - No policy changes. The table stays locked down; only the server-side writer (service role)
      writes the new columns. `get_result` remains SECURITY DEFINER, executable by anon and authenticated.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shadow_work_results' AND column_name = 'mini_reading') THEN
    ALTER TABLE shadow_work_results ADD COLUMN mini_reading jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shadow_work_results' AND column_name = 'mini_reading_status') THEN
    ALTER TABLE shadow_work_results ADD COLUMN mini_reading_status text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shadow_work_results' AND column_name = 'mini_reading_error') THEN
    ALTER TABLE shadow_work_results ADD COLUMN mini_reading_error text;
  END IF;
END $$;

DROP FUNCTION IF EXISTS get_result(uuid);

CREATE FUNCTION get_result(p_result_id uuid)
RETURNS TABLE(
  name text,
  chiron_sign text,
  chiron_house text,
  chiron_degree numeric,
  shadow_id text,
  has_purchased boolean,
  mini_reading jsonb,
  mini_reading_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
SELECT
  name,
  chiron_sign,
  chiron_house,
  chiron_degree,
  shadow_id,
  has_purchased,
  mini_reading,
  mini_reading_status
FROM shadow_work_results
WHERE id = p_result_id
LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION get_result(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_result(uuid) TO anon, authenticated;
