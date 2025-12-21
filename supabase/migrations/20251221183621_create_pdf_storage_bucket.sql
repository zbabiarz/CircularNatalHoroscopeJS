/*
  # Create PDF Storage Bucket

  1. Storage
    - Create a public bucket named 'pdfs' for storing PDF reports
    - Enable public access for viewing PDFs via direct links

  2. Security
    - Anyone can read/view PDFs (public bucket)
    - Only authenticated users can upload PDFs
    - Only authenticated users can delete their own PDFs
*/

-- Create the storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdfs');

-- Allow anyone to view PDFs (public access)
CREATE POLICY "Public can view PDFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pdfs');

-- Allow authenticated users to delete their own PDFs
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'pdfs');
