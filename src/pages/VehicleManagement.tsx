
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Settings, Activity, AlertTriangle, Users, DollarSign } from 'lucide-react';
import GP51DeviceManagement from '@/components/fleet/GP51DeviceManagement';
import VehicleServiceManagement from '@/components/fleet/VehicleServiceManagement';

const VehicleManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive vehicle and device management with GP51 integration
        </p>
      </div>

      <Tabs defaultValue="devices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <GP51DeviceManagement />
        </TabsContent>

        <TabsContent value="services">
          <VehicleServiceManagement />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Active fleet vehicles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configured</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Fully configured vehicles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Currently active vehicles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Vehicles needing attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Management Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Management Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">Device Configuration</h3>
                  </div>
                  <p className="text-sm text-gray-600">Configure vehicle device settings and parameters</p>
                </Card>

                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-medium">Maintenance Alerts</h3>
                  </div>
                  <p className="text-sm text-gray-600">Monitor and manage maintenance schedules</p>
                </Card>

                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">Performance Monitoring</h3>
                  </div>
                  <p className="text-sm text-gray-600">Track vehicle performance metrics and health</p>
                </Card>

                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-5 w-5 text-purple-500" />
                    <h3 className="font-medium">Service Management</h3>
                  </div>
                  <p className="text-sm text-gray-600">Manage device service renewals and billing</p>
                </Card>

                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    <h3 className="font-medium">User Assignment</h3>
                  </div>
                  <p className="text-sm text-gray-600">Assign vehicles to users and manage permissions</p>
                </Card>

                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Truck className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-medium">Fleet Analytics</h3>
                  </div>
                  <p className="text-sm text-gray-600">Analyze fleet performance and utilization</p>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Analytics dashboard will be available once vehicles are configured.</p>
                <p className="text-sm">Start by adding devices through the Devices tab.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleManagement;
