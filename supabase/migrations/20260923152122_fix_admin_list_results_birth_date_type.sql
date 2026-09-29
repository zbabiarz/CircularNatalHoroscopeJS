/*
  # Fix admin_list_results return type mismatch

  1. Bug
    - `admin_list_results` declares `birth_date` as `text` in the RETURN TABLE,
      but the underlying column is `date`. Postgres throws:
      "Returned type date does not match expected type text in column 4."
    - This caused the Admin page to error on every list fetch, which the
      frontend interpreted as an auth failure and kicked the user back to login.

  2. Fix
    - Cast `birth_date::text` in the inner SELECT so the return types match.
    - Also cast `chiron_degree::numeric` to be safe.
    - Recreate the function with the same SECURITY DEFINER + passcode gate.
*/

CREATE OR REPLACE FUNCTION admin_list_results(
  p_passcode text,
  p_sign_filter text DEFAULT NULL,
  p_sort_field text DEFAULT 'created_at',
  p_sort_dir text DEFAULT 'desc',
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  birth_date text,
  birth_time text,
  birth_location text,
  chiron_sign text,
  chiron_house text,
  chiron_degree numeric,
  shadow_id text,
  shadow_text text,
  ai_report text,
  ai_report_status text,
  ai_report_error text,
  has_purchased boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT admin_passcode_ok(p_passcode) THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE format(
    'SELECT id, name, email, birth_date::text, birth_time, birth_location,
            chiron_sign, chiron_house, chiron_degree, shadow_id, shadow_text,
            ai_report, ai_report_status, ai_report_error, has_purchased, created_at
     FROM shadow_work_results
     WHERE ($1 IS NULL OR chiron_sign = $1)
     ORDER BY %I %s
     OFFSET $2 LIMIT $3',
    CASE WHEN p_sort_field IN ('name','email','birth_date','chiron_sign','created_at')
         THEN p_sort_field ELSE 'created_at' END,
    CASE WHEN p_sort_dir = 'asc' THEN 'ASC' ELSE 'DESC' END
  ) USING p_sign_filter, p_offset, p_limit;
END;
$$;

REVOKE ALL ON FUNCTION admin_list_results(text, text, text, text, integer, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_list_results(text, text, text, text, integer, integer) TO anon, authenticated;
