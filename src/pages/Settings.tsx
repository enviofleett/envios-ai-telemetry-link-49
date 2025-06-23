
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompanySettingsForm from '@/components/settings/CompanySettingsForm';
import BrandingSettingsForm from '@/components/settings/BrandingSettingsForm';
import BillingSettingsForm from '@/components/settings/BillingSettingsForm';
import GP51IntegrationTab from '@/components/admin/tabs/GP51IntegrationTab';
import DataManagementTab from '@/components/admin/tabs/DataManagementTab';
import { 
  Building2, 
  Palette, 
  CreditCard, 
  Shield, 
  Database,
  Settings as SettingsIcon 
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your application preferences and integrations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="gp51" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            GP51 Integration
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Settings
              </CardTitle>
              <CardDescription>
                Configure your company information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanySettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandingSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Settings
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillingSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gp51">
          <GP51IntegrationTab />
        </TabsContent>

        <TabsContent value="data">
          <DataManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
