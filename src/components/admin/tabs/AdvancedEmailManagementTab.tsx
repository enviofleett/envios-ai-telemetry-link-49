
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Users, Zap, Send, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { scheduledCampaignsService, EmailCampaign } from '@/services/emailCampaigns/scheduledCampaignsService';
import { bulkEmailService } from '@/services/emailBulk/bulkEmailService';

type CampaignType = 'one_time' | 'recurring' | 'event_based';

interface NewCampaign {
  campaign_name: string;
  campaign_type: CampaignType;
  target_audience: string;
  schedule_type: string;
  scheduled_for?: string;
  template_id?: string;
}

const AdvancedEmailManagementTab: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    campaign_name: '',
    campaign_type: 'one_time',
    target_audience: 'all_users',
    schedule_type: 'immediate'
  });
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

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
  }, []);

  const handleCreateCampaign = async () => {
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

      // Reset form
      setNewCampaign({
        campaign_name: '',
        campaign_type: 'one_time',
        target_audience: 'all_users',
        schedule_type: 'immediate'
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Advanced Email Management
          </CardTitle>
          <CardDescription>
            Create and manage email campaigns, bulk operations, and advanced email workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campaigns" className="space-y-4">
            <TabsList>
              <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Create New Campaign</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaign_name">Campaign Name</Label>
                      <Input
                        id="campaign_name"
                        value={newCampaign.campaign_name}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, campaign_name: e.target.value }))}
                        placeholder="Enter campaign name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Campaign Type</Label>
                      <Select 
                        value={newCampaign.campaign_type} 
                        onValueChange={(value: CampaignType) => setNewCampaign(prev => ({ ...prev, campaign_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">One Time</SelectItem>
                          <SelectItem value="recurring">Recurring</SelectItem>
                          <SelectItem value="event_based">Event Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Audience</Label>
                      <Select 
                        value={newCampaign.target_audience} 
                        onValueChange={(value) => setNewCampaign(prev => ({ ...prev, target_audience: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_users">All Users</SelectItem>
                          <SelectItem value="active_users">Active Users</SelectItem>
                          <SelectItem value="admins">Administrators</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Email Template</Label>
                      <Select 
                        value={newCampaign.template_id || ''} 
                        onValueChange={(value) => setNewCampaign(prev => ({ ...prev, template_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.template_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleCreateCampaign} 
                      disabled={isLoading || !newCampaign.campaign_name}
                      className="w-full"
                    >
                      {isLoading ? 'Creating...' : 'Create Campaign'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Active Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {campaigns.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No campaigns created yet
                        </p>
                      ) : (
                        campaigns.map((campaign) => (
                          <div key={campaign.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{campaign.campaign_name}</h4>
                              <Badge variant={
                                campaign.status === 'active' ? 'default' :
                                campaign.status === 'completed' ? 'secondary' :
                                'outline'
                              }>
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              Type: {campaign.campaign_type} • Target: {campaign.target_audience}
                            </p>
                            <div className="flex gap-2">
                              {campaign.status === 'draft' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleExecuteCampaign(campaign.id)}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Execute
                                </Button>
                              )}
                              {campaign.status === 'active' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handlePauseCampaign(campaign.id)}
                                >
                                  Pause
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bulk Email Operations</CardTitle>
                  <CardDescription>
                    Send emails to multiple recipients or import contact lists
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Bulk email operations will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Analytics</CardTitle>
                  <CardDescription>
                    Track email performance and engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Email analytics will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedEmailManagementTab;
