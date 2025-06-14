
import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Mail, Bell, Palette, Zap, BarChart3 } from 'lucide-react';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';

const SMTPConfigurationTab = React.lazy(() => import('./SMTPConfigurationTab'));
const EmailTemplatesTab = React.lazy(() => import('./EmailTemplatesTab'));
const EmailTriggersTab = React.lazy(() => import('./EmailTriggersTab'));
const AdvancedEmailManagement = React.lazy(() => import('./AdvancedEmailManagement'));

const TabLoader = () => (
  <div className="flex items-center justify-center p-10 min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="smtp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            SMTP Config
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Email Triggers
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <SMTPConfigurationTab />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

        <TabsContent value="templates">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <EmailTemplatesTab />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

        <TabsContent value="triggers">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <EmailTriggersTab />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

        <TabsContent value="advanced">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <AdvancedEmailManagement />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure your notification preferences and delivery methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Notification preferences will be available in the next phase of development.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
