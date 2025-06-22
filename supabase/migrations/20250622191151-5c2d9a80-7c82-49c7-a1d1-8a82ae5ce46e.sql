
-- Create bulk_import_jobs table for tracking GP51 vehicle import operations
CREATE TABLE public.bulk_import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'completed_with_errors', 'failed')),
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  successful_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  current_chunk INTEGER NOT NULL DEFAULT 0,
  total_chunks INTEGER NOT NULL DEFAULT 0,
  chunk_size INTEGER NOT NULL DEFAULT 50,
  error_log JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  import_type TEXT NOT NULL DEFAULT 'gp51_vehicles',
  import_data JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id)
);

-- Add Row Level Security
ALTER TABLE public.bulk_import_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for bulk import jobs
CREATE POLICY "Users can view their own import jobs" 
  ON public.bulk_import_jobs 
  FOR SELECT 
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create import jobs" 
  ON public.bulk_import_jobs 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own import jobs" 
  ON public.bulk_import_jobs 
  FOR UPDATE 
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX idx_bulk_import_jobs_status ON public.bulk_import_jobs(status);
CREATE INDEX idx_bulk_import_jobs_created_by ON public.bulk_import_jobs(created_by);
CREATE INDEX idx_bulk_import_jobs_created_at ON public.bulk_import_jobs(created_at);

-- Add trigger for updated_at
CREATE TRIGGER bulk_import_jobs_updated_at
  BEFORE UPDATE ON public.bulk_import_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
