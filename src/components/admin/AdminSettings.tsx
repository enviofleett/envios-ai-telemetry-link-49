
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { SettingsSidebar } from './SettingsSidebar';

// Import existing components
import UsersTab from './tabs/UsersTab';
import WorkshopsTab from './tabs/WorkshopsTab';
import SMTPTab from './tabs/SMTPTab';
import HealthTab from './tabs/HealthTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import PackagesTab from './tabs/PackagesTab';
import CSVImportTab from './tabs/CSVImportTab';
import CompanyTab from './tabs/CompanyTab';
import BillingTab from './tabs/BillingTab';
import NotificationsTab from './tabs/NotificationsTab';
import MapsTab from './tabs/MapsTab';
import GeofencingTab from './tabs/GeofencingTab';
import SMTPGuideTab from './tabs/SMTPGuideTab';
import GP51ValidationTab from './tabs/GP51ValidationTab';
import EmailNotificationsTab from './tabs/EmailNotificationsTab';

// Import new enhanced component
import AdminWorkshopManagementEnhanced from './AdminWorkshopManagementEnhanced';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('packages');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'packages':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Package Management
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PackagesTab />
            </CardContent>
          </Card>
        );
      case 'csv-import':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                CSV Import
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CSVImportTab />
            </CardContent>
          </Card>
        );
      case 'company':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Company Settings
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyTab />
            </CardContent>
          </Card>
        );
      case 'billing':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Billing Management
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BillingTab />
            </CardContent>
          </Card>
        );
      case 'users':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Management
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UsersTab />
            </CardContent>
          </Card>
        );
      case 'workshops':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Workshop Management
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminWorkshopManagementEnhanced />
            </CardContent>
          </Card>
        );
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Notification Settings
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationsTab />
            </CardContent>
          </Card>
        );
      case 'email-notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Email Notifications
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmailNotificationsTab />
            </CardContent>
          </Card>
        );
      case 'gp51-integration':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                GP51 Integration
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GP51IntegrationTab />
            </CardContent>
          </Card>
        );
      case 'health':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HealthTab />
            </CardContent>
          </Card>
        );
      case 'maps':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Maps Configuration
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapsTab />
            </CardContent>
          </Card>
        );
      case 'analytics':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Analytics
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsTab />
            </CardContent>
          </Card>
        );
      case 'geofencing':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Geofencing
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GeofencingTab />
            </CardContent>
          </Card>
        );
      case 'smtp-guide':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SMTP Setup Guide
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SMTPGuideTab />
            </CardContent>
          </Card>
        );
      case 'smtp':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SMTP Configuration
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SMTPTab />
            </CardContent>
          </Card>
        );
      case 'gp51-validation':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                GP51 Validation
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GP51ValidationTab />
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Package Management
                <Badge variant="outline" className="text-xs">
                  Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PackagesTab />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)]">
      <SettingsSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
