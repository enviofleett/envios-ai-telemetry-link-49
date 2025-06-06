
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Car, Signal, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const GPS51StatusPanel: React.FC = () => {
  // Mock data - in real implementation, this would come from GPS51 API
  const statusMetrics = {
    totalDevices: 12,
    onlineDevices: 10,
    offlineDevices: 2,
    activeUsers: 8,
    lastSync: '2 minutes ago',
    signalStrength: 85
  };

  const getStatusColor = (online: number, total: number) => {
    const percentage = (online / total) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Devices */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Devices</p>
              <p className="text-2xl font-bold text-blue-900">{statusMetrics.totalDevices}</p>
            </div>
            <Car className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Device Status */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Online Devices</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${getStatusColor(statusMetrics.onlineDevices, statusMetrics.totalDevices)}`}>
                  {statusMetrics.onlineDevices}
                </p>
                <Badge variant="secondary" className="bg-green-200 text-green-800">
                  {Math.round((statusMetrics.onlineDevices / statusMetrics.totalDevices) * 100)}%
                </Badge>
              </div>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Signal Strength */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Signal Strength</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-purple-900">{statusMetrics.signalStrength}%</p>
                <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                  Strong
                </Badge>
              </div>
            </div>
            <Signal className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">GPS51 System</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-600">Operational</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Last sync: {statusMetrics.lastSync}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-gray-500 mt-1">Live</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51StatusPanel;
