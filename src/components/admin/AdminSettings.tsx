
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import { SettingsSidebar } from './SettingsSidebar';
import { MapTilerApiConfiguration } from './MapTilerApiConfiguration';
import PackageManagementDashboard from '@/components/packages/PackageManagementDashboard';
import CSVImportTab from './tabs/CSVImportTab';
import CompanySettingsTab from '@/components/settings/CompanySettingsTab';
import BillingSettingsTab from '@/components/settings/BillingSettingsTab';
import FleetUserManagementTab from '@/components/settings/FleetUserManagementTab';
import NotificationsSettingsTab from '@/components/settings/NotificationsSettingsTab';
import GP51IntegrationTab from './tabs/GP51IntegrationTab';
import GP51HealthDashboard from '@/components/AdminSettings/GP51HealthDashboard';
import MapsTab from './tabs/MapsTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import GeofencingTab from './tabs/GeofencingTab';
import SMTPGuideTab from './tabs/SMTPGuideTab';
import SMTPSettings from '@/components/AdminSettings/SMTPSettings';
import GP51ValidationTab from './tabs/GP51ValidationTab';
import { EmailNotificationSystem } from '@/components/notifications/EmailNotificationSystem';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('packages');

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="packages" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Package Management</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage subscription packages, features, and pricing tiers
                  </p>
                </div>
                <PackageManagementDashboard />
              </TabsContent>

              <TabsContent value="csv-import" className="space-y-4 mt-6">
                <CSVImportTab />
              </TabsContent>

              <TabsContent value="company" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Company Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure your company information and fleet management settings
                  </p>
                </div>
                <CompanySettingsTab />
              </TabsContent>

              <TabsContent value="billing" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Billing & Subscription Management</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage your subscription, billing settings, and usage monitoring
                  </p>
                </div>
                <BillingSettingsTab />
              </TabsContent>

              <TabsContent value="users" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Fleet User Management</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage fleet user roles, permissions, and GP51 access levels
                  </p>
                </div>
                <FleetUserManagementTab />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Fleet Notifications & Alerts</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure real-time alerts, notifications, and delivery preferences
                  </p>
                </div>
                <NotificationsSettingsTab />
              </TabsContent>

              <TabsContent value="email-notifications" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Email Notification Management</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure and manage email templates, delivery logs, and notification settings
                  </p>
                </div>
                <EmailNotificationSystem />
              </TabsContent>

              <TabsContent value="gp51-integration" className="space-y-4 mt-6">
                <GP51IntegrationTab />
              </TabsContent>

              <TabsContent value="health" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">GP51 Platform Health Monitoring</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Real-time monitoring of GP51 connection status, vehicle synchronization, and system health
                  </p>
                </div>
                <GP51HealthDashboard />
              </TabsContent>

              <TabsContent value="maps" className="space-y-6">
                <MapTilerApiConfiguration />
                <MapsTab />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4 mt-6">
                <AnalyticsTab />
              </TabsContent>

              <TabsContent value="geofencing" className="space-y-4 mt-6">
                <GeofencingTab />
              </TabsContent>

              <TabsContent value="smtp-guide" className="space-y-4 mt-6">
                <SMTPGuideTab />
              </TabsContent>

              <TabsContent value="smtp" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">SMTP Configuration</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure email server settings for notifications and alerts
                  </p>
                </div>
                <SMTPSettings />
              </TabsContent>

              <TabsContent value="gp51-validation" className="space-y-4 mt-6">
                <GP51ValidationTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
