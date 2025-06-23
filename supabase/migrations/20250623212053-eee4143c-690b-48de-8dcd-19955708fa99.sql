
-- Create missing tables that are being referenced in the codebase

-- Create bulk_extraction_jobs table
CREATE TABLE IF NOT EXISTS public.bulk_extraction_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_accounts INTEGER NOT NULL DEFAULT 0,
  processed_accounts INTEGER NOT NULL DEFAULT 0,
  successful_accounts INTEGER NOT NULL DEFAULT 0,
  failed_accounts INTEGER NOT NULL DEFAULT 0,
  total_vehicles INTEGER NOT NULL DEFAULT 0,
  extracted_data JSONB,
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create gp51_system_imports table
CREATE TABLE IF NOT EXISTS public.gp51_system_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_type TEXT NOT NULL DEFAULT 'complete_system',
  status TEXT NOT NULL DEFAULT 'pending',
  current_phase TEXT,
  phase_details TEXT,
  progress_percentage INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  successful_users INTEGER DEFAULT 0,
  total_devices INTEGER DEFAULT 0,
  successful_devices INTEGER DEFAULT 0,
  backup_tables JSONB,
  rollback_data JSONB,
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user_import_jobs table
CREATE TABLE IF NOT EXISTS public.user_import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  import_type TEXT DEFAULT 'passwordless',
  total_usernames INTEGER NOT NULL DEFAULT 0,
  processed_usernames INTEGER NOT NULL DEFAULT 0,
  successful_imports INTEGER NOT NULL DEFAULT 0,
  failed_imports INTEGER NOT NULL DEFAULT 0,
  total_vehicles_imported INTEGER NOT NULL DEFAULT 0,
  admin_gp51_username TEXT,
  imported_usernames JSONB,
  progress_percentage INTEGER DEFAULT 0,
  current_step TEXT,
  step_details TEXT,
  error_log JSONB,
  import_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create workshops table
CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  service_types JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gp51_import_progress_phases table (referenced in importProgressMonitor)
CREATE TABLE IF NOT EXISTS public.gp51_import_progress_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_import_id UUID REFERENCES public.gp51_system_imports(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  phase_progress INTEGER DEFAULT 0,
  phase_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for the new tables
ALTER TABLE public.bulk_extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp51_system_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp51_import_progress_phases ENABLE ROW LEVEL SECURITY;

-- Create policies for bulk_extraction_jobs (admin only)
CREATE POLICY "Admin can manage bulk extraction jobs" ON public.bulk_extraction_jobs
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create policies for gp51_system_imports (admin only)
CREATE POLICY "Admin can manage system imports" ON public.gp51_system_imports
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create policies for user_import_jobs (admin only)
CREATE POLICY "Admin can manage user import jobs" ON public.user_import_jobs
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create policies for workshops (admin only for now)
CREATE POLICY "Admin can manage workshops" ON public.workshops
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create policies for gp51_import_progress_phases (admin only)
CREATE POLICY "Admin can view import progress phases" ON public.gp51_import_progress_phases
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
