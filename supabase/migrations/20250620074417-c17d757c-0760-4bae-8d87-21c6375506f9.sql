
-- Report Templates Table
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  template_config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.envio_users(id),
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scheduled Reports Table  
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE CASCADE,
  schedule_config JSONB NOT NULL DEFAULT '{}',
  recipients JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.envio_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Report Executions Table
CREATE TABLE IF NOT EXISTS public.report_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_report_id UUID REFERENCES public.scheduled_reports(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.report_templates(id),
  execution_status TEXT NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  error_message TEXT,
  execution_metrics JSONB DEFAULT '{}',
  report_data JSONB DEFAULT '{}'
);

-- Enable RLS on new tables
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_templates
CREATE POLICY "Users can view their own report templates"
  ON public.report_templates
  FOR SELECT
  USING (auth.uid() = created_by OR is_system_template = true);

CREATE POLICY "Users can manage their own report templates"
  ON public.report_templates
  FOR ALL
  USING (auth.uid() = created_by);

-- RLS Policies for scheduled_reports
CREATE POLICY "Users can view their own scheduled reports"
  ON public.scheduled_reports
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own scheduled reports"
  ON public.scheduled_reports
  FOR ALL
  USING (auth.uid() = created_by);

-- RLS Policies for report_executions
CREATE POLICY "Users can view their report executions"
  ON public.report_executions
  FOR SELECT
  USING (auth.uid() IN (
    SELECT created_by FROM public.scheduled_reports WHERE id = scheduled_report_id
    UNION
    SELECT created_by FROM public.report_templates WHERE id = template_id
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON public.report_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_report_templates_report_type ON public.report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_created_by ON public.scheduled_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON public.scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_executions_scheduled_report ON public.report_executions(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON public.report_executions(execution_status);

-- Add triggers for updated_at
CREATE TRIGGER report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
