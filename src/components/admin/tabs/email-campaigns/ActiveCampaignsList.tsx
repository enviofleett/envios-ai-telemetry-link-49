
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';
import { EmailCampaign } from '@/services/emailCampaigns/types';

interface ActiveCampaignsListProps {
  campaigns: EmailCampaign[];
  onExecuteCampaign: (campaignId: string) => Promise<void>;
  onPauseCampaign: (campaignId: string) => Promise<void>;
}

export const ActiveCampaignsList: React.FC<ActiveCampaignsListProps> = ({
  campaigns,
  onExecuteCampaign,
  onPauseCampaign
}) => {
  return (
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
                      onClick={() => onExecuteCampaign(campaign.id)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Execute
                    </Button>
                  )}
                  {campaign.status === 'active' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onPauseCampaign(campaign.id)}
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
  );
};
