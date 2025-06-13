
import { supabase } from '@/integrations/supabase/client';
import { emailTriggerService } from '@/services/emailTriggers/emailTriggerService';

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

class ScheduledCampaignsService {
  async createCampaign(campaignData: Partial<EmailCampaign>): Promise<EmailCampaign> {
    const { data, error } = await (supabase as any)
      .from('email_campaigns')
      .insert({
        ...campaignData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailCampaign;
  }

  async getCampaigns(): Promise<EmailCampaign[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailCampaign[] || [];
    } catch (error) {
      console.warn('Email campaigns not available:', error);
      return [];
    }
  }

  async updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    const { data, error } = await (supabase as any)
      .from('email_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as EmailCampaign;
  }

  async executeCampaign(campaignId: string): Promise<CampaignExecution> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await (supabase as any)
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Create execution record
      const { data: execution, error: execError } = await (supabase as any)
        .from('campaign_executions')
        .insert({
          campaign_id: campaignId,
          execution_status: 'pending',
          total_recipients: 0,
          sent_count: 0,
          failed_count: 0
        })
        .select()
        .single();

      if (execError) throw execError;

      // Get target recipients based on campaign criteria
      const recipients = await this.getTargetRecipients(campaign);

      // Update execution with recipient count
      await (supabase as any)
        .from('campaign_executions')
        .update({
          execution_status: 'running',
          started_at: new Date().toISOString(),
          total_recipients: recipients.length
        })
        .eq('id', execution.id);

      // Send emails to all recipients
      let sentCount = 0;
      let failedCount = 0;
      const errorLog: any[] = [];

      for (const recipient of recipients) {
        try {
          await emailTriggerService.sendTriggeredEmail({
            to: recipient.email,
            trigger_type: 'campaign',
            template_variables: {
              user_name: recipient.name || recipient.email,
              campaign_name: campaign.campaign_name,
              ...campaign.template_variables
            },
            related_entity_id: campaignId,
            fallback_subject: `Campaign: ${campaign.campaign_name}`,
            fallback_message: `This is a message from campaign: ${campaign.campaign_name}`
          });
          sentCount++;
        } catch (error) {
          failedCount++;
          errorLog.push({
            recipient: recipient.email,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Update execution with final results
      const finalExecution = await (supabase as any)
        .from('campaign_executions')
        .update({
          execution_status: failedCount === 0 ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          sent_count: sentCount,
          failed_count: failedCount,
          error_log: errorLog
        })
        .eq('id', execution.id)
        .select()
        .single();

      if (finalExecution.error) throw finalExecution.error;
      return finalExecution.data as CampaignExecution;

    } catch (error) {
      console.error('Campaign execution failed:', error);
      throw error;
    }
  }

  private async getTargetRecipients(campaign: EmailCampaign): Promise<Array<{email: string, name?: string}>> {
    let query = supabase.from('envio_users').select('email, name');

    switch (campaign.target_audience) {
      case 'all_users':
        // No additional filters
        break;
      
      case 'specific_users':
        if (campaign.target_criteria?.user_ids) {
          query = query.in('id', campaign.target_criteria.user_ids);
        }
        break;
      
      case 'user_segments':
        // Apply segment filters based on criteria
        if (campaign.target_criteria?.registration_status) {
          query = query.eq('registration_status', campaign.target_criteria.registration_status);
        }
        if (campaign.target_criteria?.user_type) {
          query = query.eq('gp51_user_type', campaign.target_criteria.user_type);
        }
        break;
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    await this.updateCampaign(campaignId, { status: 'paused' });
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    await this.updateCampaign(campaignId, { status: 'active' });
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) throw error;
  }
}

export const scheduledCampaignsService = new ScheduledCampaignsService();
