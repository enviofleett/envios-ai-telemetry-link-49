
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Building, Palette, Bell, FileText, MapPin } from 'lucide-react';
import CompanySettingsTab from './settings/CompanySettingsTab';
import BrandingSettingsTab from './settings/BrandingSettingsTab';
import NotificationsSettingsTab from './settings/NotificationsSettingsTab';
import BillingSettingsTab from './settings/BillingSettingsTab';
import GeocodingSettingsTab from './settings/GeocodingSettingsTab';

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
              <CompanySettingsTab />
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <BrandingSettingsTab />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationsSettingsTab />
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <BillingSettingsTab />
            </TabsContent>

            <TabsContent value="geocoding" className="space-y-4">
              <GeocodingSettingsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
