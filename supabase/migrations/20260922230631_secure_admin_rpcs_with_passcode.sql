/*
  # Secure the admin portal functions

  1. New Tables
    - `admin_access` - single row holding a bcrypt hash of the admin portal passcode.
      Row Level Security is enabled and no policies exist, and all privileges are
      revoked from the anon and authenticated roles, so the hash is unreachable
      through the Data API.

  2. Changes
    - `admin_list_results` and `admin_count_results` previously returned the whole
      lead table (names, emails, birth data, full reports) to any anonymous caller.
      Both are recreated with a required `p_passcode` argument that is verified
      against the stored bcrypt hash before any data is returned.

  3. Security
    - Unauthorised callers receive an exception instead of data.
    - EXECUTE is granted only to anon and authenticated (the portal is not signed in),
      and the passcode is the gate.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS admin_access (
  id integer PRIMARY KEY DEFAULT 1,
  passcode_hash text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT admin_access_single_row CHECK (id = 1)
);

ALTER TABLE admin_access ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON admin_access FROM anon, authenticated, public;

INSERT INTO admin_access (id, passcode_hash)
VALUES (1, extensions.crypt('shadow-portal-8Q42-RKMV', extensions.gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION admin_passcode_ok(p_passcode text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_access
    WHERE id = 1
      AND p_passcode IS NOT NULL
      AND passcode_hash = extensions.crypt(p_passcode, passcode_hash)
  );
$$;

REVOKE ALL ON FUNCTION admin_passcode_ok(text) FROM public, anon, authenticated;

DROP FUNCTION IF EXISTS admin_list_results(text, text, text, integer, integer);
DROP FUNCTION IF EXISTS admin_count_results(text);

CREATE FUNCTION admin_list_results(
  p_passcode text,
  p_sign_filter text DEFAULT NULL,
  p_sort_field text DEFAULT 'created_at',
  p_sort_dir text DEFAULT 'desc',
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  id uuid, name text, email text, birth_date text, birth_time text,
  birth_location text, chiron_sign text, chiron_house text, chiron_degree numeric,
  shadow_id text, shadow_text text, ai_report text, ai_report_status text,
  ai_report_error text, has_purchased boolean, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT admin_passcode_ok(p_passcode) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

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
  ) USING p_sign_filter, GREATEST(COALESCE(p_offset, 0), 0), LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
END;
$$;

CREATE FUNCTION admin_count_results(
  p_passcode text,
  p_sign_filter text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_count bigint;
BEGIN
  IF NOT admin_passcode_ok(p_passcode) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT count(*) INTO v_count
  FROM shadow_work_results
  WHERE (p_sign_filter IS NULL OR chiron_sign = p_sign_filter);

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION admin_list_results(text, text, text, text, integer, integer) FROM public;
REVOKE ALL ON FUNCTION admin_count_results(text, text) FROM public;
GRANT EXECUTE ON FUNCTION admin_list_results(text, text, text, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_count_results(text, text) TO anon, authenticated;
