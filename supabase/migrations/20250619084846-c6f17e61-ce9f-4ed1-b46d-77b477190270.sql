
-- Update the candidates table to allow NULL values for email column
-- This will fix the processing failures when resumes don't contain email addresses
ALTER TABLE public.candidates ALTER COLUMN email DROP NOT NULL;
