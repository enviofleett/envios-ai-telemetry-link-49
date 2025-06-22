
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Users, 
  Car, 
  Clock, 
  Activity, 
  Pause,
  Info
} from 'lucide-react';

interface ImportPreviewData {
  vehicles: {
    total: number;
    sample: any[];
    activeCount: number;
    inactiveCount: number;
  };
  users: {
    total: number;
    sample: any[];
    activeCount: number;
  };
  groups: {
    total: number;
    sample: any[];
  };
  summary: {
    totalDevices: number;
    totalUsers: number;
    totalGroups: number;
    lastUpdate: string;
    estimatedImportTime: string;
  };
}

interface ImportPreviewPanelProps {
  data: ImportPreviewData;
}

const ImportPreviewPanel: React.FC<ImportPreviewPanelProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Car className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{data.vehicles.total}</div>
                <div className="text-sm text-gray-600">Total Vehicles</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    {data.vehicles.activeCount} Active
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Pause className="h-3 w-3 mr-1" />
                    {data.vehicles.inactiveCount} Inactive
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{data.users.total}</div>
                <div className="text-sm text-gray-600">Total Users</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {data.users.activeCount} Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{data.groups.total}</div>
                <div className="text-sm text-gray-600">Device Groups</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {data.summary.estimatedImportTime}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Summary */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">Import Summary</div>
            <div className="text-sm space-y-1">
              <div>• {data.summary.totalDevices} vehicles will be imported and assigned to users</div>
              <div>• {data.summary.totalUsers} GP51 users will be processed for account mapping</div>
              <div>• {data.summary.totalGroups} device groups will be created for organization</div>
              <div>• Estimated completion time: {data.summary.estimatedImportTime}</div>
              <div>• Data last fetched: {new Date(data.summary.lastUpdate).toLocaleString()}</div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Sample Data Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Samples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Sample Vehicles ({data.vehicles.sample.length} of {data.vehicles.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.vehicles.sample.slice(0, 5).map((vehicle, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{vehicle.devicename || `Device ${vehicle.deviceid}`}</div>
                    <div className="text-xs text-gray-500">ID: {vehicle.deviceid}</div>
                    {vehicle.sim && <div className="text-xs text-gray-500">SIM: {vehicle.sim}</div>}
                  </div>
                  <div className="text-right">
                    {vehicle.devicetype && (
                      <Badge variant="outline" className="text-xs mb-1">
                        {vehicle.devicetype}
                      </Badge>
                    )}
                    {vehicle.lastupdate && (
                      <div className="text-xs text-gray-500">
                        {new Date(vehicle.lastupdate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {data.vehicles.total > 5 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  ... and {data.vehicles.total - 5} more vehicles
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Samples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sample Users ({data.users.sample.length} of {data.users.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.users.sample.slice(0, 5).map((user, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{user.username}</div>
                    {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                    {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                  </div>
                  <div className="text-right">
                    {user.usertype && (
                      <Badge variant="outline" className="text-xs">
                        {user.usertype}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {data.users.total > 5 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  ... and {data.users.total - 5} more users
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportPreviewPanel;
