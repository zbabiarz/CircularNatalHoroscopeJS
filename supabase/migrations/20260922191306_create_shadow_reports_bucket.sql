/*
  # Create shadow-reports storage bucket

  1. Storage
    - Creates the `shadow-reports` public bucket used by the generate-pdf
      edge function to store generated Shadow Map PDFs.
    - Adds storage policies so the generate-pdf function (using service role)
      can upload, and anyone can read the PDFs via public URL.

  2. Important Notes
    - The bucket is public so PDF URLs can be shared in emails.
    - INSERT policy allows any role (the edge function uses service_role
      which bypasses RLS, but this covers fallback cases).
    - SELECT policy allows public read access.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('shadow-reports', 'shadow-reports', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload shadow reports" ON storage.objects;
CREATE POLICY "Anyone can upload shadow reports"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'shadow-reports');

DROP POLICY IF EXISTS "Public can view shadow reports" ON storage.objects;
CREATE POLICY "Public can view shadow reports"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'shadow-reports');
