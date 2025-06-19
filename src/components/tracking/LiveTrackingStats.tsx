
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, WifiOff, Clock } from 'lucide-react';

interface LiveTrackingStatsProps {
  realtimeStats: {
    totalUpdates: number;
    lastUpdateTime: Date | null;
    websocketConnected: boolean;
    activeVehicles: number;
  };
  connectionState: string;
}

export const LiveTrackingStats: React.FC<LiveTrackingStatsProps> = ({
  realtimeStats,
  connectionState
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connection</CardTitle>
          {realtimeStats.websocketConnected ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <Badge 
            variant={realtimeStats.websocketConnected ? "default" : "destructive"}
            className="text-xs"
          >
            {connectionState}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{realtimeStats.activeVehicles}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
          <Activity className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{realtimeStats.totalUpdates}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Update</CardTitle>
          <Clock className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {realtimeStats.lastUpdateTime 
              ? realtimeStats.lastUpdateTime.toLocaleTimeString()
              : 'Never'
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTrackingStats;
