
import { supabase } from '@/integrations/supabase/client';

export interface EmailAnalytics {
  totalEmailsSent: number;
  totalEmailsFailed: number;
  successRate: number;
  avgDeliveryTime: number;
  topTriggerTypes: Array<{
    trigger_type: string;
    count: number;
    success_rate: number;
  }>;
  dailyStats: Array<{
    date: string;
    sent: number;
    failed: number;
  }>;
  recentActivity: Array<{
    id: string;
    recipient_email: string;
    subject: string;
    status: string;
    created_at: string;
    trigger_type?: string;
  }>;
}

export interface CampaignAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalRecipients: number;
  avgOpenRate: number;
  topPerformingCampaigns: Array<{
    campaign_name: string;
    sent_count: number;
    success_rate: number;
  }>;
}

class EmailAnalyticsService {
  async getEmailAnalytics(dateRange: { from: Date; to: Date }): Promise<EmailAnalytics> {
    const fromDate = dateRange.from.toISOString();
    const toDate = dateRange.to.toISOString();

    // Get total email stats
    const { data: deliveryStats, error: deliveryError } = await supabase
      .from('email_delivery_logs')
      .select('status, created_at, trigger_type')
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    if (deliveryError) throw deliveryError;

    const totalEmailsSent = deliveryStats?.filter(log => log.status === 'SENT').length || 0;
    const totalEmailsFailed = deliveryStats?.filter(log => log.status === 'FAILED').length || 0;
    const successRate = totalEmailsSent + totalEmailsFailed > 0 
      ? (totalEmailsSent / (totalEmailsSent + totalEmailsFailed)) * 100 
      : 0;

    // Get trigger type analytics
    const triggerTypeStats = this.aggregateTriggerTypeStats(deliveryStats || []);

    // Get daily stats
    const dailyStats = this.aggregateDailyStats(deliveryStats || []);

    // Get recent activity
    const { data: recentActivity, error: recentError } = await supabase
      .from('email_delivery_logs')
      .select('id, recipient_email, subject, status, created_at, trigger_type')
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentError) throw recentError;

    return {
      totalEmailsSent,
      totalEmailsFailed,
      successRate,
      avgDeliveryTime: 2.5, // Placeholder - would need delivery time tracking
      topTriggerTypes: triggerTypeStats,
      dailyStats,
      recentActivity: recentActivity || []
    };
  }

  async getCampaignAnalytics(): Promise<CampaignAnalytics> {
    // Get campaign stats
    const { data: campaigns, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*');

    if (campaignError) throw campaignError;

    // Get execution stats
    const { data: executions, error: executionError } = await supabase
      .from('campaign_executions')
      .select('*');

    if (executionError) throw executionError;

    const totalCampaigns = campaigns?.length || 0;
    const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
    const completedCampaigns = campaigns?.filter(c => c.status === 'completed').length || 0;
    const totalRecipients = executions?.reduce((sum, exec) => sum + (exec.total_recipients || 0), 0) || 0;

    // Calculate top performing campaigns
    const topPerformingCampaigns = this.calculateTopPerformingCampaigns(campaigns || [], executions || []);

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalRecipients,
      avgOpenRate: 65.2, // Placeholder - would need tracking
      topPerformingCampaigns
    };
  }

  private aggregateTriggerTypeStats(logs: any[]): Array<{trigger_type: string, count: number, success_rate: number}> {
    const stats = new Map<string, {total: number, success: number}>();

    logs.forEach(log => {
      const triggerType = log.trigger_type || 'unknown';
      if (!stats.has(triggerType)) {
        stats.set(triggerType, { total: 0, success: 0 });
      }
      const current = stats.get(triggerType)!;
      current.total++;
      if (log.status === 'SENT') current.success++;
    });

    return Array.from(stats.entries())
      .map(([trigger_type, data]) => ({
        trigger_type,
        count: data.total,
        success_rate: data.total > 0 ? (data.success / data.total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private aggregateDailyStats(logs: any[]): Array<{date: string, sent: number, failed: number}> {
    const dailyMap = new Map<string, {sent: number, failed: number}>();

    logs.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { sent: 0, failed: 0 });
      }
      const dayStats = dailyMap.get(date)!;
      if (log.status === 'SENT') dayStats.sent++;
      else if (log.status === 'FAILED') dayStats.failed++;
    });

    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateTopPerformingCampaigns(campaigns: any[], executions: any[]): Array<{campaign_name: string, sent_count: number, success_rate: number}> {
    return campaigns
      .map(campaign => {
        const campaignExecutions = executions.filter(exec => exec.campaign_id === campaign.id);
        const totalSent = campaignExecutions.reduce((sum, exec) => sum + (exec.sent_count || 0), 0);
        const totalFailed = campaignExecutions.reduce((sum, exec) => sum + (exec.failed_count || 0), 0);
        const successRate = totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0;

        return {
          campaign_name: campaign.campaign_name,
          sent_count: totalSent,
          success_rate: successRate
        };
      })
      .filter(campaign => campaign.sent_count > 0)
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 5);
  }

  async getEmailDeliveryRate(hours: number = 24): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('email_delivery_logs')
      .select('status')
      .gte('created_at', since);

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    const sent = data.filter(log => log.status === 'SENT').length;
    return (sent / data.length) * 100;
  }
}

export const emailAnalyticsService = new EmailAnalyticsService();
