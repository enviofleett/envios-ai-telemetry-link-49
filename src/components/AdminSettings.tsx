
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Map, BarChart3, MapPin, Mail, Activity, Book, Package, Settings, User, Bell, Info, Upload } from 'lucide-react';
import GP51CredentialsForm from './AdminSettings/GP51CredentialsForm';
import EnhancedGP51StatusCard from './AdminSettings/EnhancedGP51StatusCard';
import GP51HealthDashboard from './AdminSettings/GP51HealthDashboard';
import EnhancedMapApiManagement from './AdminSettings/EnhancedMapApiManagement';
import MapAnalyticsDashboard from '@/components/map/MapAnalyticsDashboard';
import GeofenceManager from '@/components/map/GeofenceManager';
import SMTPSettings from './AdminSettings/SMTPSettings';
import SMTPProviderGuide from './AdminSettings/SMTPProviderGuide';
import PackageManagementDashboard from '@/components/packages/PackageManagementDashboard';
import CompanySettingsTab from '@/components/settings/CompanySettingsTab';
import BillingSettingsTab from '@/components/settings/BillingSettingsTab';
import NotificationsSettingsTab from '@/components/settings/NotificationsSettingsTab';
import FleetUserManagementTab from '@/components/settings/FleetUserManagementTab';
import CSVVehicleImportManager from '@/components/csv/CSVVehicleImportManager';

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
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-13">
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Packages</span>
            </TabsTrigger>
            <TabsTrigger value="csv-import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">CSV Import</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="gp51" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">GP51</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="maps" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Maps</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="geofencing" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Geofencing</span>
            </TabsTrigger>
            <TabsTrigger value="smtp-guide" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              <span className="hidden sm:inline">SMTP Setup</span>
            </TabsTrigger>
            <TabsTrigger value="smtp" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">SMTP Config</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="packages" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Subscriber Package Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Manage subscriber packages, features, permissions, and referral codes
              </p>
            </div>
            <PackageManagementDashboard />
          </TabsContent>

          <TabsContent value="csv-import" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">CSV Vehicle Import</h3>
              <p className="text-sm text-gray-600 mb-4">
                Import vehicle data from CSV files with validation and conflict resolution
              </p>
            </div>
            <CSVVehicleImportManager />
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
          
          <TabsContent value="gp51" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">GP51 LIVE Platform Connection</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure connection to GP51 platform for vehicle data synchronization
              </p>
            </div>
            <EnhancedGP51StatusCard />
            <GP51CredentialsForm />
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
          
          <TabsContent value="maps" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Enhanced MapTiler API Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Advanced API key management with auto-switching, threshold monitoring, and performance analytics
              </p>
            </div>
            <EnhancedMapApiManagement />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Map Usage Analytics</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive analytics for map usage, performance metrics, and user behavior
              </p>
            </div>
            <MapAnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="geofencing" className="space-y-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Geofencing Management</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create and manage geographical boundaries with real-time vehicle monitoring
              </p>
            </div>
            <GeofenceManager />
          </TabsContent>
          
          <TabsContent value="smtp-guide" className="space-y-4 mt-6">
            <SMTPProviderGuide />
          </TabsContent>
          
          <TabsContent value="smtp" className="space-y-4 mt-6">
            <SMTPSettings />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
