-- Make the resumes bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'resumes';

-- Create storage policies to allow public access to resume files
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING ( bucket_id = 'resumes' );

CREATE POLICY "Allow authenticated users to upload resumes" ON storage.objects
FOR INSERT WITH CHECK ( 
  bucket_id = 'resumes' AND 
  auth.role() = 'authenticated' 
);

CREATE POLICY "Allow users to delete their own resumes" ON storage.objects
FOR DELETE USING ( 
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1] 
);