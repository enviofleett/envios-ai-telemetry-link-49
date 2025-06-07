
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompanySettingsTab from '@/components/settings/CompanySettingsTab';
import BillingSettingsTab from '@/components/settings/BillingSettingsTab';
import EnhancedSMTPSettingsTab from '@/components/settings/EnhancedSMTPSettingsTab';
import BrandingCustomizationTab from '@/components/settings/BrandingCustomizationTab';
import GP51ApiSettingsTab from '@/components/settings/GP51ApiSettingsTab';
import NotificationsSettingsTab from '@/components/settings/NotificationsSettingsTab';
import FleetUserManagementTab from '@/components/settings/FleetUserManagementTab';
import { PrivacySettingsTab } from '@/components/settings/PrivacySettingsTab';

const Settings: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account, company, and system preferences
          </p>
        </div>
        
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="gp51">GP51 API</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="smtp">Email</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-6">
            <CompanySettingsTab />
          </TabsContent>

          <TabsContent value="gp51" className="space-y-6">
            <GP51ApiSettingsTab />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingSettingsTab />
          </TabsContent>

          <TabsContent value="smtp" className="space-y-6">
            <EnhancedSMTPSettingsTab />
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <BrandingCustomizationTab />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationsSettingsTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <FleetUserManagementTab />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <PrivacySettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
