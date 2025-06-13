
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart3, Mail, Send, Users, Calendar, FileText, Play, Pause, Square, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { scheduledCampaignsService } from '@/services/emailCampaigns/scheduledCampaignsService';
import { bulkEmailService } from '@/services/emailBulk/bulkEmailService';

interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  status: string;
  target_audience: string;
  created_at: string;
  scheduled_for?: string;
}

interface BulkEmailOperation {
  id: string;
  operation_name: string;
  status: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  created_at: string;
}

const AdvancedEmailManagementTab: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkEmailOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    campaign_type: 'one_time',
    target_audience: 'all_users',
    schedule_type: 'immediate',
    scheduled_for: '',
    template_id: ''
  });

  const [bulkEmailData, setBulkEmailData] = useState({
    subject: '',
    message: '',
    recipients: [] as Array<{email: string, name?: string}>
  });

  const loadCampaigns = async () => {
    try {
      const campaigns = await scheduledCampaignsService.getCampaigns();
      setCampaigns(campaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadBulkOperations = async () => {
    try {
      const operations = await bulkEmailService.getBulkOperations();
      setBulkOperations(operations);
    } catch (error) {
      console.error('Error loading bulk operations:', error);
    }
  };

  useEffect(() => {
    loadCampaigns();
    loadBulkOperations();
  }, []);

  const handleCreateCampaign = async () => {
    setIsLoading(true);
    try {
      await scheduledCampaignsService.createCampaign(newCampaign);
      
      toast({
        title: "Success",
        description: "Campaign created successfully"
      });
      
      setIsCreateDialogOpen(false);
      setNewCampaign({
        campaign_name: '',
        campaign_type: 'one_time',
        target_audience: 'all_users',
        schedule_type: 'immediate',
        scheduled_for: '',
        template_id: ''
      });
      
      loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: 'pause' | 'resume' | 'execute' | 'delete') => {
    try {
      switch (action) {
        case 'pause':
          await scheduledCampaignsService.pauseCampaign(campaignId);
          break;
        case 'resume':
          await scheduledCampaignsService.resumeCampaign(campaignId);
          break;
        case 'execute':
          await scheduledCampaignsService.executeCampaign(campaignId);
          break;
        case 'delete':
          await scheduledCampaignsService.deleteCampaign(campaignId);
          break;
      }
      
      toast({
        title: "Success",
        description: `Campaign ${action}d successfully`
      });
      
      loadCampaigns();
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} campaign`,
        variant: "destructive"
      });
    }
  };

  const handleBulkEmailSend = async () => {
    if (!bulkEmailData.subject || !bulkEmailData.message || bulkEmailData.recipients.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add recipients",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await bulkEmailService.processBulkEmail({
        recipients: bulkEmailData.recipients,
        subject: bulkEmailData.subject,
        message: bulkEmailData.message,
        send_immediately: true
      });
      
      toast({
        title: "Success",
        description: "Bulk email operation started successfully"
      });
      
      setBulkEmailData({
        subject: '',
        message: '',
        recipients: []
      });
      
      loadBulkOperations();
    } catch (error) {
      console.error('Error sending bulk email:', error);
      toast({
        title: "Error",
        description: "Failed to start bulk email operation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'bg-green-500';
      case 'paused':
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProgressPercentage = (operation: BulkEmailOperation) => {
    if (operation.total_items === 0) return 0;
    return Math.round((operation.processed_items / operation.total_items) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Email Management
          </CardTitle>
          <CardDescription>
            Manage email campaigns, bulk operations, and advanced email features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campaigns" className="space-y-4">
            <TabsList>
              <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Email Campaigns</h3>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Campaign</DialogTitle>
                      <DialogDescription>
                        Set up a new email campaign for your users
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="campaign_name">Campaign Name</Label>
                        <Input
                          id="campaign_name"
                          value={newCampaign.campaign_name}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, campaign_name: e.target.value }))}
                          placeholder="Monthly Newsletter"
                        />
                      </div>
                      <div>
                        <Label htmlFor="campaign_type">Campaign Type</Label>
                        <Select value={newCampaign.campaign_type} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, campaign_type: value }))}>
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
                      <div>
                        <Label htmlFor="target_audience">Target Audience</Label>
                        <Select value={newCampaign.target_audience} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, target_audience: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_users">All Users</SelectItem>
                            <SelectItem value="specific_users">Specific Users</SelectItem>
                            <SelectItem value="user_segments">User Segments</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreateCampaign} disabled={isLoading} className="w-full">
                        {isLoading ? 'Creating...' : 'Create Campaign'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{campaign.campaign_name}</h4>
                          <p className="text-sm text-muted-foreground">{campaign.campaign_type} • {campaign.target_audience}</p>
                          <p className="text-xs text-muted-foreground">Created: {new Date(campaign.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${getStatusColor(campaign.status)} text-white`}>
                            {campaign.status}
                          </Badge>
                          <div className="flex gap-1">
                            {campaign.status === 'paused' && (
                              <Button size="sm" variant="outline" onClick={() => handleCampaignAction(campaign.id, 'resume')}>
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {campaign.status === 'active' && (
                              <Button size="sm" variant="outline" onClick={() => handleCampaignAction(campaign.id, 'pause')}>
                                <Pause className="h-3 w-3" />
                              </Button>
                            )}
                            {campaign.status === 'draft' && (
                              <Button size="sm" variant="outline" onClick={() => handleCampaignAction(campaign.id, 'execute')}>
                                <Send className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleCampaignAction(campaign.id, 'delete')}>
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Send Bulk Email</h3>
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <Label htmlFor="bulk_subject">Subject</Label>
                        <Input
                          id="bulk_subject"
                          value={bulkEmailData.subject}
                          onChange={(e) => setBulkEmailData(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Important Update"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bulk_message">Message</Label>
                        <Textarea
                          id="bulk_message"
                          value={bulkEmailData.message}
                          onChange={(e) => setBulkEmailData(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Your message content..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>Recipients ({bulkEmailData.recipients.length})</Label>
                        <Textarea
                          placeholder="Enter email addresses, one per line..."
                          onChange={(e) => {
                            const emails = e.target.value.split('\n').filter(email => email.trim());
                            setBulkEmailData(prev => ({
                              ...prev,
                              recipients: emails.map(email => ({ email: email.trim() }))
                            }));
                          }}
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleBulkEmailSend} disabled={isLoading} className="w-full">
                        {isLoading ? 'Sending...' : 'Send Bulk Email'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recent Bulk Operations</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {bulkOperations.map((operation) => (
                      <Card key={operation.id}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{operation.operation_name}</h4>
                              <Badge variant="outline" className={`${getStatusColor(operation.status)} text-white text-xs`}>
                                {operation.status}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress: {operation.processed_items}/{operation.total_items}</span>
                                <span>{getProgressPercentage(operation)}%</span>
                              </div>
                              <Progress value={getProgressPercentage(operation)} className="h-1" />
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">✓ {operation.successful_items} sent</span>
                              <span className="text-red-600">✗ {operation.failed_items} failed</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Campaigns</p>
                        <p className="text-xl font-semibold">{campaigns.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Active Campaigns</p>
                        <p className="text-xl font-semibold">{campaigns.filter(c => c.status === 'active').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bulk Operations</p>
                        <p className="text-xl font-semibold">{bulkOperations.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...campaigns.slice(0, 3), ...bulkOperations.slice(0, 2)].map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="text-sm font-medium">
                            {'campaign_name' in item ? item.campaign_name : item.operation_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {'campaign_name' in item ? 'Campaign' : 'Bulk Operation'}
                        </Badge>
                      </div>
                    ))}
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
