
import { supabase } from '@/integrations/supabase/client';
import { EmailCampaign, CampaignRecipient } from './types';

export class RecipientManager {
  async getTargetRecipients(campaign: EmailCampaign): Promise<CampaignRecipient[]> {
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
}
