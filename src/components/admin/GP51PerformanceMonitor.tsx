import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Wifi, WifiOff, ArrowRight, PauseCircle, AlertTriangle } from 'lucide-react';
import { GP51DataService } from '@/services/gp51/GP51DataService';
import type { GP51PerformanceMetrics } from '@/types/gp51Performance';

const GP51PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<GP51PerformanceMetrics>({
    responseTime: 0,
    success: true,
    requestStartTime: '',
    errorType: '',
    deviceCount: 0,
    groupCount: 0,
    timestamp: '',
    apiCallCount: 0,
    errorRate: 0,
    averageResponseTime: 0,
    movingVehicles: 0,
    stoppedVehicles: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const dataService = new GP51DataService();

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const performanceData = await dataService.getPerformanceMetrics();
      
      const metricsUpdate = {
        timestamp: new Date().toISOString(),
        apiCallCount: 1,
        errorRate: performanceData.success ? 0 : 100,
        success: performanceData.success,
        error: performanceData.error || '',
        responseTime: performanceData.responseTime || 0,
        requestStartTime: new Date().toISOString(),
        deviceCount: performanceData.deviceCount || 0,
        groupCount: performanceData.groupCount || 0,
        activeDevices: performanceData.activeDevices || 0,
        inactiveDevices: performanceData.inactiveDevices || 0,
        onlineDevices: performanceData.onlineDevices || 0,
        offlineDevices: performanceData.offlineDevices || 0,
        movingVehicles: performanceData.movingVehicles || 0,
        stoppedVehicles: performanceData.stoppedVehicles || 0,
        averageResponseTime: performanceData.averageResponseTime || 0
      };

      setMetrics(metricsUpdate);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      setMetrics(prev => ({
        ...prev,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GP51 Performance Metrics</CardTitle>
          <CardDescription>Real-time system performance monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant={metrics.success ? "default" : "destructive"}>
                {metrics.success ? "Healthy" : "Error"}
              </Badge>
              <span className="text-sm text-gray-600">
                Response: {metrics.responseTime}ms
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                Devices: {metrics.deviceCount}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm">
                Groups: {metrics.groupCount}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                Online: {metrics.onlineDevices || 0}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4 text-orange-500" />
              <span className="text-sm">
                Offline: {metrics.offlineDevices || 0}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <ArrowRight className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                Moving: {metrics.movingVehicles}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <PauseCircle className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Stopped: {metrics.stoppedVehicles}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">
                API Calls: {metrics.apiCallCount}
              </span>
            </div>
          </div>
          
          {!metrics.success && metrics.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">Error: {metrics.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51PerformanceMonitor;
