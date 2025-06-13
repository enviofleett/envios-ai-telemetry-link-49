
export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: 'one_time' | 'recurring' | 'event_based';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  template_id: string;
  target_audience: 'all_users' | 'specific_users' | 'user_segments';
  target_criteria: Record<string, any>;
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_for?: string;
  recurring_pattern?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignExecution {
  id: string;
  campaign_id: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  error_log?: any[];
}

export interface CampaignRecipient {
  email: string;
  name?: string;
}
