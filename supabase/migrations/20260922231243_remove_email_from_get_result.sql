/*
  # Remove email from the public result lookup

  1. Changes
    - `get_result(p_result_id uuid)` no longer returns the `email` column.
      Anyone holding a result id could previously read the submitter's email
      address through the Data API. The result page does not need it: the
      checkout function now resolves the email server-side from the row.
  2. Security
    - Reduces the data a bare result id exposes to name, chiron placement,
      shadow id and purchase state.
*/

DROP FUNCTION IF EXISTS get_result(uuid);

CREATE FUNCTION get_result(p_result_id uuid)
RETURNS TABLE(
  name text,
  chiron_sign text,
  chiron_house text,
  chiron_degree numeric,
  shadow_id text,
  has_purchased boolean
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
  has_purchased
FROM shadow_work_results
WHERE id = p_result_id
LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION get_result(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_result(uuid) TO anon, authenticated;
