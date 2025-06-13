
import { supabase } from '@/integrations/supabase/client';
import { EmailCampaign } from './types';

export class CampaignOperations {
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
