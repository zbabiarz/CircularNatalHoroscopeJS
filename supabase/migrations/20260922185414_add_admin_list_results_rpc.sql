/*
  # Add admin_list_results RPC for Admin page

  1. New Function
    - `admin_list_results`: A SECURITY DEFINER function that returns
      shadow_work_results rows for the admin dashboard. Callable by
      anon + authenticated so the passcode-protected Admin page works.
    - Accepts optional sign filter, sort field/direction, and pagination.
    - Also adds `admin_count_results` for the total count with optional filter.

  2. Important Notes
    - These RPCs bypass RLS intentionally because the Admin page
      is protected by a client-side passcode.
    - The Result page uses `get_result(uuid)` for single-row lookups.
    - Anonymous users cannot SELECT directly on the table anymore.
*/

CREATE OR REPLACE FUNCTION admin_list_results(
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
  RETURN QUERY EXECUTE format(
    'SELECT id, name, email, birth_date, birth_time, birth_location,
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

CREATE OR REPLACE FUNCTION admin_count_results(
  p_sign_filter text DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)
  FROM shadow_work_results
  WHERE (p_sign_filter IS NULL OR chiron_sign = p_sign_filter);
$$;

GRANT EXECUTE ON FUNCTION admin_list_results(text, text, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_count_results(text) TO anon, authenticated;
