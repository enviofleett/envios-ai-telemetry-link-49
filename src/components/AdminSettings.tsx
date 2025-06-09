
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import AdminTabsList from './admin/AdminTabsList';
import PackagesTab from './admin/tabs/PackagesTab';
import CSVImportTab from './admin/tabs/CSVImportTab';
import CompanyTab from './admin/tabs/CompanyTab';
import BillingTab from './admin/tabs/BillingTab';
import UsersTab from './admin/tabs/UsersTab';
import NotificationsTab from './admin/tabs/NotificationsTab';
import GP51IntegrationTab from './admin/tabs/GP51IntegrationTab';
import GPS51Tab from './admin/tabs/GPS51Tab';
import HealthTab from './admin/tabs/HealthTab';
import MapsTab from './admin/tabs/MapsTab';
import AnalyticsTab from './admin/tabs/AnalyticsTab';
import GeofencingTab from './admin/tabs/GeofencingTab';
import SMTPGuideTab from './admin/tabs/SMTPGuideTab';
import SMTPTab from './admin/tabs/SMTPTab';

const AdminSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Enhanced System Administration
          <Badge variant="outline" className="text-xs">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="packages" className="w-full">
          <AdminTabsList />
          
          <PackagesTab />
          <CSVImportTab />
          <CompanyTab />
          <BillingTab />
          <UsersTab />
          <NotificationsTab />
          <GP51IntegrationTab />
          <GPS51Tab />
          <HealthTab />
          <MapsTab />
          <AnalyticsTab />
          <GeofencingTab />
          <SMTPGuideTab />
          <SMTPTab />
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
