
-- Create tables for the HR resume screening platform

-- Job postings table to store job requirements
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT NOT NULL,
  skills_required TEXT[], -- Array of required skills
  experience_level TEXT,
  department TEXT,
  location TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Candidates table to store parsed resume data
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL, -- HR user who uploaded/received this candidate
  job_posting_id UUID REFERENCES public.job_postings(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  experience_years INTEGER,
  skills TEXT[], -- Array of extracted skills
  education TEXT,
  work_history TEXT,
  resume_file_path TEXT, -- Path to stored resume file
  cover_letter TEXT,
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_analysis JSONB, -- Detailed AI analysis results
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'shortlisted', 'interviewed', 'hired', 'rejected')),
  source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'form_submission', 'manual')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Application forms table for dynamic form creation
CREATE TABLE public.application_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  job_posting_id UUID REFERENCES public.job_postings(id),
  title TEXT NOT NULL,
  description TEXT,
  form_fields JSONB NOT NULL, -- Dynamic form structure
  is_public BOOLEAN DEFAULT true,
  public_url_slug TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Form submissions table for public applications
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.application_forms(id) NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id),
  submission_data JSONB NOT NULL, -- All form field responses
  ip_address INET,
  user_agent TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for resume files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false);

-- Enable Row Level Security on all tables
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_postings
CREATE POLICY "Users can view their own job postings" 
  ON public.job_postings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job postings" 
  ON public.job_postings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job postings" 
  ON public.job_postings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job postings" 
  ON public.job_postings FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for candidates
CREATE POLICY "Users can view their own candidates" 
  ON public.candidates FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create candidates" 
  ON public.candidates FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidates" 
  ON public.candidates FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidates" 
  ON public.candidates FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for application_forms
CREATE POLICY "Users can view their own forms" 
  ON public.application_forms FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forms" 
  ON public.application_forms FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" 
  ON public.application_forms FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" 
  ON public.application_forms FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for form_submissions (read-only access via form ownership)
CREATE POLICY "Users can view submissions for their forms" 
  ON public.form_submissions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.application_forms 
    WHERE id = form_submissions.form_id AND user_id = auth.uid()
  ));

-- Allow public insert for form submissions (public applications)
CREATE POLICY "Anyone can submit to public forms" 
  ON public.form_submissions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.application_forms 
    WHERE id = form_submissions.form_id AND is_public = true AND status = 'active'
  ));

-- Storage policies for resumes bucket
CREATE POLICY "Users can upload resumes" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'resumes' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own resumes" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own resumes" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resumes" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX idx_job_postings_user_id ON public.job_postings(user_id);
CREATE INDEX idx_job_postings_status ON public.job_postings(status);
CREATE INDEX idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX idx_candidates_job_posting_id ON public.candidates(job_posting_id);
CREATE INDEX idx_candidates_status ON public.candidates(status);
CREATE INDEX idx_candidates_ai_score ON public.candidates(ai_score DESC);
CREATE INDEX idx_application_forms_user_id ON public.application_forms(user_id);
CREATE INDEX idx_application_forms_public_url_slug ON public.application_forms(public_url_slug);
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
