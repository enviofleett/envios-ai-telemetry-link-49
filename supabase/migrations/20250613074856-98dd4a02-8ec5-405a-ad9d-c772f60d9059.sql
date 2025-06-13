
-- Create email_campaigns table for storing campaign information
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'one_time',
  status TEXT NOT NULL DEFAULT 'draft',
  template_id UUID REFERENCES public.email_templates(id),
  target_audience TEXT NOT NULL DEFAULT 'all_users',
  target_criteria JSONB DEFAULT '{}'::jsonb,
  schedule_type TEXT NOT NULL DEFAULT 'immediate',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  recurring_pattern TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_executions table for tracking campaign runs
CREATE TABLE IF NOT EXISTS public.campaign_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  execution_status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bulk_email_operations table for bulk email jobs
CREATE TABLE IF NOT EXISTS public.bulk_email_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL DEFAULT 'send_bulk',
  operation_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  successful_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_log JSONB DEFAULT '[]'::jsonb,
  operation_data JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on new tables
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_email_operations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_campaigns
CREATE POLICY "Users can view their own email campaigns"
  ON public.email_campaigns
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own email campaigns"
  ON public.email_campaigns
  FOR ALL
  USING (auth.uid() = created_by);

-- Create RLS policies for campaign_executions
CREATE POLICY "Users can view their campaign executions"
  ON public.campaign_executions
  FOR SELECT
  USING (auth.uid() IN (SELECT created_by FROM public.email_campaigns WHERE id = campaign_id));

CREATE POLICY "System can manage campaign executions"
  ON public.campaign_executions
  FOR ALL
  USING (true);

-- Create RLS policies for bulk_email_operations
CREATE POLICY "Users can view their own bulk operations"
  ON public.bulk_email_operations
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own bulk operations"
  ON public.bulk_email_operations
  FOR ALL
  USING (auth.uid() = created_by);

-- Add triggers for updated_at
CREATE TRIGGER email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER campaign_executions_updated_at
  BEFORE UPDATE ON public.campaign_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER bulk_email_operations_updated_at
  BEFORE UPDATE ON public.bulk_email_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON public.email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_campaign_id ON public.campaign_executions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bulk_email_operations_created_by ON public.bulk_email_operations(created_by);
CREATE INDEX IF NOT EXISTS idx_bulk_email_operations_status ON public.bulk_email_operations(status);
