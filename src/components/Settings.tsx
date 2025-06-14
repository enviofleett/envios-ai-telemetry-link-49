
import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Building, Palette, Bell, FileText, MapPin } from 'lucide-react';
import { StableErrorBoundary } from '@/components/StableErrorBoundary';

const CompanySettingsTab = React.lazy(() => import('./settings/CompanySettingsTab'));
const BrandingSettingsTab = React.lazy(() => import('./settings/BrandingSettingsTab'));
const NotificationsSettingsTab = React.lazy(() => import('./settings/NotificationsSettingsTab'));
const BillingSettingsTab = React.lazy(() => import('./settings/BillingSettingsTab'));
const GeocodingSettingsTab = React.lazy(() => import('./settings/GeocodingSettingsTab'));

const TabLoader = () => (
  <div className="flex items-center justify-center p-10 min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Settings
          </CardTitle>
          <CardDescription>
            Manage your account and application preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="geocoding" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Geocoding
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-4">
              <StableErrorBoundary>
                <Suspense fallback={<TabLoader />}>
                  <CompanySettingsTab />
                </Suspense>
              </StableErrorBoundary>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <StableErrorBoundary>
                <Suspense fallback={<TabLoader />}>
                  <BrandingSettingsTab />
                </Suspense>
              </StableErrorBoundary>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <StableErrorBoundary>
                <Suspense fallback={<TabLoader />}>
                  <NotificationsSettingsTab />
                </Suspense>
              </StableErrorBoundary>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <StableErrorBoundary>
                <Suspense fallback={<TabLoader />}>
                  <BillingSettingsTab />
                </Suspense>
              </StableErrorBoundary>
            </TabsContent>

            <TabsContent value="geocoding" className="space-y-4">
              <StableErrorBoundary>
                <Suspense fallback={<TabLoader />}>
                  <GeocodingSettingsTab />
                </Suspense>
              </StableErrorBoundary>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
