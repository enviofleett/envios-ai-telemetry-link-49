import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Clock, Users, Database } from 'lucide-react';
import { gp51DataService } from '@/services/gp51/GP51DataService';

interface GP51PerformanceMetrics {
  success: boolean;
  error: string;
  responseTime: number;
  requestStartTime: string;
  deviceCount: number;
  groupCount: number;
  activeDevices: number;
  inactiveDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  movingVehicles: number;
  stoppedVehicles: number;
  timestamp: Date;
  apiCallCount: number;
  errorRate: number;
}

const GP51PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<GP51PerformanceMetrics>({
    success: false,
    error: '',
    responseTime: 0,
    requestStartTime: '',
    deviceCount: 0,
    groupCount: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    movingVehicles: 0,
    stoppedVehicles: 0,
    timestamp: new Date(),
    apiCallCount: 0,
    errorRate: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchPerformanceMetrics = async () => {
    setIsLoading(true);
    try {
      const result = await gp51DataService.getPerformanceMetrics();
      setMetrics({
        ...result,
        timestamp: new Date(),
        apiCallCount: metrics.apiCallCount + 1,
        errorRate: result.success ? metrics.errorRate : metrics.errorRate + 1
      });
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      setMetrics(prev => ({
        ...prev,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        apiCallCount: prev.apiCallCount + 1,
        errorRate: prev.errorRate + 1
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceMetrics();
    const interval = setInterval(fetchPerformanceMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">GP51 Performance</CardTitle>
        <RefreshCw className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Status</div>
              <div className="font-semibold">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-24 rounded"></div>
                ) : metrics.success ? (
                  <Badge variant="outline">Online</Badge>
                ) : (
                  <Badge variant="destructive">Offline</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Response Time</div>
              <div className="font-semibold">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-16 rounded"></div>
                ) : (
                  `${metrics.responseTime}ms`
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Devices</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.deviceCount}`
                )}
                <Activity className="h-3 w-3 text-green-500" />
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Groups</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.groupCount}`
                )}
                <Users className="h-3 w-3 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Active</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.activeDevices}`
                )}
                <CheckCircle className="h-3 w-3 text-green-500" />
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Inactive</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.inactiveDevices}`
                )}
                <XCircle className="h-3 w-3 text-red-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Online</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.onlineDevices}`
                )}
                <Wifi className="h-3 w-3 text-green-500" />
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Offline</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.offlineDevices}`
                )}
                <WifiOff className="h-3 w-3 text-red-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Moving</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.movingVehicles}`
                )}
                <ArrowRight className="h-3 w-3 text-blue-500" />
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Stopped</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.stoppedVehicles}`
                )}
                <PauseCircle className="h-3 w-3 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase text-muted-foreground">API Calls</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.apiCallCount}`
                )}
                <Database className="h-3 w-3 text-gray-500" />
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Error Rate</div>
              <div className="font-semibold flex items-center gap-1">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
                ) : (
                  `${metrics.errorRate}`
                )}
                <AlertTriangle className="h-3 w-3 text-red-500" />
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Last updated: {metrics.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51PerformanceMonitor;
