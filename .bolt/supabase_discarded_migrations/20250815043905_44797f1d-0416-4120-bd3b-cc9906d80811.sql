-- Create the update function first
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add batch_id column to candidates table for grouping batch uploads
ALTER TABLE candidates ADD COLUMN batch_id UUID;

-- Add index for better performance when querying by batch_id
CREATE INDEX idx_candidates_batch_id ON candidates(batch_id);

-- Create a table to store batch information
CREATE TABLE candidate_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  job_requirements TEXT NOT NULL,
  total_candidates INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on candidate_batches
ALTER TABLE candidate_batches ENABLE ROW LEVEL SECURITY;

-- Create policies for candidate_batches
CREATE POLICY "Users can view their own batches" 
ON candidate_batches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batches" 
ON candidate_batches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batches" 
ON candidate_batches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batches" 
ON candidate_batches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for candidate_batches updated_at
CREATE TRIGGER update_candidate_batches_updated_at
BEFORE UPDATE ON candidate_batches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();