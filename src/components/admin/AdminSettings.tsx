
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { SettingsSidebar } from './SettingsSidebar';
import { MapTilerApiConfiguration } from './MapTilerApiConfiguration';
import PackagesTab from './tabs/PackagesTab';
import CSVImportTab from './tabs/CSVImportTab';
import CompanyTab from './tabs/CompanyTab';
import BillingTab from './tabs/BillingTab';
import UsersTab from './tabs/UsersTab';
import NotificationsTab from './tabs/NotificationsTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import HealthTab from './tabs/HealthTab';
import MapsTab from './tabs/MapsTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import GeofencingTab from './tabs/GeofencingTab';
import SMTPGuideTab from './tabs/SMTPGuideTab';
import SMTPTab from './tabs/SMTPTab';
import GP51ValidationTab from './tabs/GP51ValidationTab';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('packages');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'packages':
        return <PackagesTab />;
      case 'csv-import':
        return <CSVImportTab />;
      case 'company':
        return <CompanyTab />;
      case 'billing':
        return <BillingTab />;
      case 'users':
        return <UsersTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'gp51-integration':
        return <GP51IntegrationTab />;
      case 'health':
        return <HealthTab />;
      case 'maps':
        return (
          <div className="space-y-6">
            <MapTilerApiConfiguration />
            <MapsTab />
          </div>
        );
      case 'analytics':
        return <AnalyticsTab />;
      case 'geofencing':
        return <GeofencingTab />;
      case 'smtp-guide':
        return <SMTPGuideTab />;
      case 'smtp':
        return <SMTPTab />;
      case 'gp51-validation':
        return <GP51ValidationTab />;
      default:
        return <PackagesTab />;
    }
  };

  return (
    <Card className="min-h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Administration
          <Badge variant="outline" className="text-xs">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex">
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="flex-1 p-6">
            {renderTabContent()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
