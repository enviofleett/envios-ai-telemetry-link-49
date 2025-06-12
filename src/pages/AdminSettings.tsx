
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Building, Palette, Package, Zap, Database, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CompanySettingsTab from '@/components/settings/CompanySettingsTab';
import BrandingSettingsTab from '@/components/settings/BrandingSettingsTab';
import GP51ApiSettingsTab from '@/components/settings/GP51ApiSettingsTab';
import SystemManagementTab from '@/components/settings/SystemManagementTab';
import PackageManagementTab from '@/components/settings/PackageManagementTab';
import BillingSettingsTab from '@/components/settings/BillingSettingsTab';

const AdminSettings = () => {
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('company');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Access denied. You need administrator privileges to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const tabs = [
    {
      id: 'company',
      label: 'Company',
      icon: Building,
      component: CompanySettingsTab
    },
    {
      id: 'branding',
      label: 'Branding',
      icon: Palette,
      component: BrandingSettingsTab
    },
    {
      id: 'gp51',
      label: 'GPS51 API',
      icon: Zap,
      component: GP51ApiSettingsTab
    },
    {
      id: 'packages',
      label: 'Packages',
      icon: Package,
      component: PackageManagementTab
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      component: BillingSettingsTab
    },
    {
      id: 'system',
      label: 'System',
      icon: Database,
      component: SystemManagementTab
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Admin Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Manage your FleetIQ system settings and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                <tab.component />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
