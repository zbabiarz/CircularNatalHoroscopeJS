/*
  # Fix shadow_work_results security and add get_result RPC

  1. Security Changes
    - Drop the overly permissive SELECT policy "Users can view own results by email"
      which contains `OR true`, allowing anyone to read every row.
    - Replace with a strict SELECT policy scoped to `authenticated` only,
      so the Admin page still works but the anon key cannot list rows.
    - Keep the existing INSERT policy for anon + authenticated.

  2. New Function
    - `get_result(p_result_id uuid)`: a SECURITY DEFINER function that returns
      a single row (name, email, chiron_sign, chiron_house, chiron_degree,
      shadow_id, has_purchased) by primary key. Callable by anon + authenticated
      so the Result page can load data for a specific known ID without
      needing broad SELECT access.

  3. Important Notes
    - Anonymous users can no longer list or scan the table.
    - They can only fetch a single row if they already know the UUID.
    - The Admin page queries as authenticated (via Supabase auth session),
      so the new authenticated-only SELECT policy covers it.
*/

-- 1. Replace the permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own results by email" ON shadow_work_results;

CREATE POLICY "authenticated_select_shadow_work_results"
  ON shadow_work_results FOR SELECT
  TO authenticated
  USING (true);

-- 2. Create the get_result RPC (security definer so it bypasses RLS)
CREATE OR REPLACE FUNCTION get_result(p_result_id uuid)
RETURNS TABLE (
  name text,
  email text,
  chiron_sign text,
  chiron_house text,
  chiron_degree numeric,
  shadow_id text,
  has_purchased boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    name,
    email,
    chiron_sign,
    chiron_house,
    chiron_degree,
    shadow_id,
    has_purchased
  FROM shadow_work_results
  WHERE id = p_result_id
  LIMIT 1;
$$;

-- Grant execute to anon + authenticated so both the Result page and Admin can call it
GRANT EXECUTE ON FUNCTION get_result(uuid) TO anon, authenticated;
