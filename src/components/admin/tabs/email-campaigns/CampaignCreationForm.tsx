
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface CampaignCreationFormProps {
  templates: any[];
  onCreateCampaign: (campaign: NewCampaign) => Promise<void>;
  isLoading: boolean;
}

export const CampaignCreationForm: React.FC<CampaignCreationFormProps> = ({
  templates,
  onCreateCampaign,
  isLoading
}) => {
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    campaign_name: '',
    campaign_type: 'one_time',
    target_audience: 'all_users',
    schedule_type: 'immediate'
  });

  const handleSubmit = async () => {
    await onCreateCampaign(newCampaign);
    setNewCampaign({
      campaign_name: '',
      campaign_type: 'one_time',
      target_audience: 'all_users',
      schedule_type: 'immediate'
    });
  };

  return (
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
            onValueChange={(value: TargetAudience) => setNewCampaign(prev => ({ ...prev, target_audience: value }))}
          >
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

        <div className="space-y-2">
          <Label>Schedule Type</Label>
          <Select 
            value={newCampaign.schedule_type} 
            onValueChange={(value: ScheduleType) => setNewCampaign(prev => ({ ...prev, schedule_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="recurring">Recurring</SelectItem>
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
          onClick={handleSubmit} 
          disabled={isLoading || !newCampaign.campaign_name}
          className="w-full"
        >
          {isLoading ? 'Creating...' : 'Create Campaign'}
        </Button>
      </CardContent>
    </Card>
  );
};
