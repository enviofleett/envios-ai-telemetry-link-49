
import { supabase } from '@/integrations/supabase/client';
import { emailTriggerService } from '@/services/emailTriggers/emailTriggerService';
import { EmailCampaign, CampaignExecution } from './types';
import { RecipientManager } from './recipientManager';

export class ExecutionManager {
  private recipientManager = new RecipientManager();

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
      const recipients = await this.recipientManager.getTargetRecipients(campaign);

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
      const results = await this.sendEmailsToRecipients(recipients, campaign, campaignId);

      // Update execution with final results
      const finalExecution = await (supabase as any)
        .from('campaign_executions')
        .update({
          execution_status: results.failedCount === 0 ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          sent_count: results.sentCount,
          failed_count: results.failedCount,
          error_log: results.errorLog
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

  private async sendEmailsToRecipients(
    recipients: Array<{email: string, name?: string}>, 
    campaign: EmailCampaign, 
    campaignId: string
  ) {
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
            ...campaign.target_criteria
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

    return { sentCount, failedCount, errorLog };
  }
}
