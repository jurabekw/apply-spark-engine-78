
-- Add original_filename column to candidates table to store the original filename
ALTER TABLE public.candidates 
ADD COLUMN original_filename TEXT;
