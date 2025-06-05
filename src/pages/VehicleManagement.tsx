
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Settings, Activity, AlertTriangle } from 'lucide-react';

const VehicleManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
        <p className="text-gray-600 mt-2">
          Manage individual vehicle configurations, settings, and maintenance
        </p>
      </div>

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

      {/* Vehicle Management Content */}
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
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No vehicles configured yet.</p>
            <p className="text-sm">Start by adding vehicles to your fleet through the fleet management section.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleManagement;
