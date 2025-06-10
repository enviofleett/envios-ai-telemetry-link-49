
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import AdminTabsList from './admin/AdminTabsList';
import PackagesTab from './admin/tabs/PackagesTab';
import CSVImportTab from './admin/tabs/CSVImportTab';
import CompanyTab from './admin/tabs/CompanyTab';
import BillingTab from './admin/tabs/BillingTab';
import UsersTab from './admin/tabs/UsersTab';
import NotificationsTab from './admin/tabs/NotificationsTab';
import GP51IntegrationTab from './admin/tabs/GP51IntegrationTab';
import HealthTab from './admin/tabs/HealthTab';
import MapsTab from './admin/tabs/MapsTab';
import AnalyticsTab from './admin/tabs/AnalyticsTab';
import GeofencingTab from './admin/tabs/GeofencingTab';
import SMTPGuideTab from './admin/tabs/SMTPGuideTab';
import SMTPTab from './admin/tabs/SMTPTab';
import GP51ValidationTab from './admin/tabs/GP51ValidationTab';
import WorkshopsTab from './admin/tabs/WorkshopsTab';

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
          
          <TabsContent value="packages">
            <PackagesTab />
          </TabsContent>
          
          <TabsContent value="csv-import">
            <CSVImportTab />
          </TabsContent>
          
          <TabsContent value="company">
            <CompanyTab />
          </TabsContent>
          
          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>
          
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="workshops">
            <WorkshopsTab />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
          
          <TabsContent value="gp51-integration">
            <GP51IntegrationTab />
          </TabsContent>
          
          <TabsContent value="health">
            <HealthTab />
          </TabsContent>
          
          <TabsContent value="maps">
            <MapsTab />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
          
          <TabsContent value="geofencing">
            <GeofencingTab />
          </TabsContent>
          
          <TabsContent value="smtp-guide">
            <SMTPGuideTab />
          </TabsContent>
          
          <TabsContent value="smtp">
            <SMTPTab />
          </TabsContent>
          
          <TabsContent value="gp51-validation">
            <GP51ValidationTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
