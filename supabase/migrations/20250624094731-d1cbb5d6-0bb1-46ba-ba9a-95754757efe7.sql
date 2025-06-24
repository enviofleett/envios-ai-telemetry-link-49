
-- Create the missing system_import_jobs table for tracking import progress
CREATE TABLE IF NOT EXISTS public.gp51_system_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type text NOT NULL DEFAULT 'gp51_preview',
  status text NOT NULL DEFAULT 'pending',
  current_phase text,
  progress_percentage integer DEFAULT 0,
  total_users integer DEFAULT 0,
  successful_users integer DEFAULT 0,
  total_devices integer DEFAULT 0,
  successful_devices integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  import_results jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS for security
ALTER TABLE public.gp51_system_imports ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own import jobs
CREATE POLICY "Users can view their own import jobs" 
  ON public.gp51_system_imports 
  FOR SELECT 
  USING (true); -- Allow all authenticated users for now, can be restricted later

-- Create policy for system to insert import jobs
CREATE POLICY "System can create import jobs" 
  ON public.gp51_system_imports 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for system to update import jobs
CREATE POLICY "System can update import jobs" 
  ON public.gp51_system_imports 
  FOR UPDATE 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gp51_system_imports_status ON public.gp51_system_imports(status);
CREATE INDEX IF NOT EXISTS idx_gp51_system_imports_created_at ON public.gp51_system_imports(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_gp51_system_imports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gp51_system_imports_updated_at
  BEFORE UPDATE ON public.gp51_system_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_gp51_system_imports_updated_at();
