
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail } from 'lucide-react';
import { CampaignCreationForm } from './email-campaigns/CampaignCreationForm';
import { ActiveCampaignsList } from './email-campaigns/ActiveCampaignsList';
import { BulkOperationsTab } from './email-campaigns/BulkOperationsTab';
import { AnalyticsTab } from './email-campaigns/AnalyticsTab';
import { useCampaignManagement } from './email-campaigns/useCampaignManagement';

const AdvancedEmailManagementTab: React.FC = () => {
  const {
    campaigns,
    templates,
    isLoading,
    handleCreateCampaign,
    handleExecuteCampaign,
    handlePauseCampaign
  } = useCampaignManagement();

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
                <CampaignCreationForm
                  templates={templates}
                  onCreateCampaign={handleCreateCampaign}
                  isLoading={isLoading}
                />
                <ActiveCampaignsList
                  campaigns={campaigns}
                  onExecuteCampaign={handleExecuteCampaign}
                  onPauseCampaign={handlePauseCampaign}
                />
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <BulkOperationsTab />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedEmailManagementTab;
