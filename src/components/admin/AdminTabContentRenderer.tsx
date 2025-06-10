
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

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

// Import enhanced component
import AdminWorkshopManagementEnhanced from './AdminWorkshopManagementEnhanced';

interface AdminTabContentRendererProps {
  activeTab: string;
}

const AdminTabContentRenderer: React.FC<AdminTabContentRendererProps> = ({ activeTab }) => {
  const renderTabWithCard = (title: string, TabComponent: React.ComponentType) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {title}
          <Badge variant="outline" className="text-xs">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TabComponent />
      </CardContent>
    </Card>
  );

  switch (activeTab) {
    case 'packages':
      return renderTabWithCard('Package Management', PackagesTab);
    case 'csv-import':
      return renderTabWithCard('CSV Import', CSVImportTab);
    case 'company':
      return renderTabWithCard('Company Settings', CompanyTab);
    case 'billing':
      return renderTabWithCard('Billing Management', BillingTab);
    case 'users':
      return renderTabWithCard('User Management', UsersTab);
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
      return renderTabWithCard('Notification Settings', NotificationsTab);
    case 'email-notifications':
      return renderTabWithCard('Email Notifications', EmailNotificationsTab);
    case 'gp51-integration':
      return renderTabWithCard('GP51 Integration', GP51IntegrationTab);
    case 'health':
      return renderTabWithCard('System Health', HealthTab);
    case 'maps':
      return renderTabWithCard('Maps Configuration', MapsTab);
    case 'analytics':
      return renderTabWithCard('Analytics', AnalyticsTab);
    case 'geofencing':
      return renderTabWithCard('Geofencing', GeofencingTab);
    case 'smtp-guide':
      return renderTabWithCard('SMTP Setup Guide', SMTPGuideTab);
    case 'smtp':
      return renderTabWithCard('SMTP Configuration', SMTPTab);
    case 'gp51-validation':
      return renderTabWithCard('GP51 Validation', GP51ValidationTab);
    default:
      return renderTabWithCard('Package Management', PackagesTab);
  }
};

export default AdminTabContentRenderer;
