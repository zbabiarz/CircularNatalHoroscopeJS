/*
  # Lock down the report storage buckets

  1. Security
    - Drop the policies that let anyone list and read every object in the `pdfs`
      and `shadow-reports` buckets. Without them the storage API can no longer be
      used to enumerate customer report files.
    - Drop the policies that let anyone upload arbitrary files into either bucket.
      Reports are written by the generate-pdf function using the service role,
      which is not subject to these policies.
    - Make `shadow-reports` private; the function now issues signed download links.
    - `pdfs` keeps its public flag so the download links already emailed to past
      customers continue to resolve, but it can no longer be listed or written to.
    - Add a size cap and a PDF-only MIME restriction to both buckets.

  2. Notes
    - No objects are deleted.
*/

DROP POLICY IF EXISTS "Public can view PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view shadow reports" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload shadow reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;

UPDATE storage.buckets
SET public = false,
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'shadow-reports';

UPDATE storage.buckets
SET file_size_limit = 26214400,
    allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'pdfs';
