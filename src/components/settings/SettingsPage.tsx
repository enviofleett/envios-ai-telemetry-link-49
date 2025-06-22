
import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Mail, Bell, Palette, Zap, BarChart3, Building2, DollarSign } from 'lucide-react';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';

const SMTPConfigurationTab = React.lazy(() => import('./SMTPConfigurationTab'));
const EmailTemplatesTab = React.lazy(() => import('./EmailTemplatesTab'));
const EmailTriggersTab = React.lazy(() => import('./EmailTriggersTab'));
const AdvancedEmailManagement = React.lazy(() => import('./AdvancedEmailManagement'));
const CompanySettingsTab = React.lazy(() => import('./CompanySettingsTab'));
const EnhancedBrandingTab = React.lazy(() => import('./EnhancedBrandingTab'));
const CurrencyManagementTab = React.lazy(() => import('./CurrencyManagementTab'));

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

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Currency
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            SMTP
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Triggers
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

        <TabsContent value="company">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <CompanySettingsTab />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

        <TabsContent value="branding">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <EnhancedBrandingTab />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

        <TabsContent value="currency">
          <StableErrorBoundary>
            <Suspense fallback={<TabLoader />}>
              <CurrencyManagementTab />
            </Suspense>
          </StableErrorBoundary>
        </TabsContent>

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
