
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { scheduledCampaignsService, EmailCampaign } from '@/services/emailCampaigns/scheduledCampaignsService';
import { supabase } from '@/integrations/supabase/client';

type CampaignType = 'one_time' | 'recurring' | 'event_based';
type TargetAudience = 'all_users' | 'specific_users' | 'user_segments';
type ScheduleType = 'immediate' | 'scheduled' | 'recurring';

interface NewCampaign {
  campaign_name: string;
  campaign_type: CampaignType;
  target_audience: TargetAudience;
  schedule_type: ScheduleType;
  scheduled_for?: string;
  template_id?: string;
}

export const useCampaignManagement = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadCampaigns = async () => {
    try {
      const data = await scheduledCampaignsService.getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load email campaigns",
        variant: "destructive"
      });
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateCampaign = async (newCampaign: NewCampaign) => {
    setIsLoading(true);
    try {
      const campaignData: Partial<EmailCampaign> = {
        campaign_name: newCampaign.campaign_name,
        campaign_type: newCampaign.campaign_type,
        target_audience: newCampaign.target_audience,
        schedule_type: newCampaign.schedule_type,
        scheduled_for: newCampaign.scheduled_for,
        template_id: newCampaign.template_id
      };

      await scheduledCampaignsService.createCampaign(campaignData);
      
      toast({
        title: "Campaign Created",
        description: "Email campaign has been created successfully"
      });

      loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create email campaign",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteCampaign = async (campaignId: string) => {
    try {
      await scheduledCampaignsService.executeCampaign(campaignId);
      toast({
        title: "Campaign Executed",
        description: "Email campaign is being processed"
      });
      loadCampaigns();
    } catch (error) {
      console.error('Error executing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to execute campaign",
        variant: "destructive"
      });
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await scheduledCampaignsService.pauseCampaign(campaignId);
      toast({
        title: "Campaign Paused",
        description: "Email campaign has been paused"
      });
      loadCampaigns();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to pause campaign",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
  }, []);

  return {
    campaigns,
    templates,
    isLoading,
    handleCreateCampaign,
    handleExecuteCampaign,
    handlePauseCampaign
  };
};
