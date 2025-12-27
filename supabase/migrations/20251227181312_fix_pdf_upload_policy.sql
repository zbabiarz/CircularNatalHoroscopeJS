/*
  # Fix PDF Upload Policy

  1. Changes
    - Drop the existing authenticated-only upload policy
    - Create a new policy that allows anyone (including anonymous users) to upload PDFs
    - This enables the quiz app to work without user authentication

  2. Security
    - Public read access remains (anyone can view PDFs)
    - Anyone can upload PDFs (required for anonymous quiz users)
    - Authenticated users can still delete PDFs
*/

-- Drop the existing policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;

-- Allow anyone (including anonymous users) to upload PDFs
CREATE POLICY "Anyone can upload PDFs"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'pdfs');