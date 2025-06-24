
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Wifi, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Database,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useSessionHealth } from '@/hooks/useSessionHealth';
import { gp51HealthMonitor } from '@/services/gp51HealthMonitor';

const GP51RealTimeMonitor: React.FC = () => {
  const { health, healthStatus, isLoading, refreshHealth } = useSessionHealth(true);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSystemMetrics = async () => {
    setIsRefreshing(true);
    try {
      const metrics = await gp51HealthMonitor.getHealthMetrics();
      setSystemMetrics(metrics);
    } catch (error) {
      console.error('Failed to refresh system metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshSystemMetrics();
    const interval = setInterval(refreshSystemMetrics, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <CardTitle>Real-Time GP51 Monitor</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshHealth}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          <CardDescription>
            Live monitoring of GP51 session health and system status
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="session" className="space-y-4">
        <TabsList>
          <TabsTrigger value="session">Session Health</TabsTrigger>
          <TabsTrigger value="system">System Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="session" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {health?.isHealthy ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Session Status</p>
                    <p className={`text-xs ${health?.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                      {health?.isHealthy ? 'Healthy' : 'Unhealthy'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className={`h-5 w-5 ${getRiskLevelColor(health?.riskLevel || 'high')}`} />
                  <div>
                    <p className="text-sm font-medium">Risk Level</p>
                    <p className={`text-xs capitalize ${getRiskLevelColor(health?.riskLevel || 'high')}`}>
                      {health?.riskLevel || 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Session Age</p>
                    <p className="text-xs text-gray-600">
                      {health?.sessionAge ? `${Math.round(health.sessionAge / 60000)}m` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Latency</p>
                    <p className="text-xs text-gray-600">
                      {health?.connectionLatency ? `${health.connectionLatency}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {health?.issues && health.issues.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800 text-sm">Session Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {health.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-yellow-700 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-2" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {healthStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Overall Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Health:</span>
                    <Badge className={getStatusColor(healthStatus.overallHealth)}>
                      {healthStatus.overallHealth}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime:</span>
                    <span className="text-sm text-gray-600">{healthStatus.uptime.toFixed(1)}%</span>
                  </div>

                  {healthStatus.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {healthStatus.recommendations.map((rec, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start">
                            <TrendingUp className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {systemMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Vehicles</p>
                      <p className="text-2xl font-bold">{systemMetrics.totalVehicles}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Active Vehicles</p>
                      <p className="text-2xl font-bold">{systemMetrics.activeVehicles}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Online Vehicles</p>
                      <p className="text-2xl font-bold">{systemMetrics.onlineVehicles}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className={`h-5 w-5 ${getStatusColor(systemMetrics.systemStatus).split(' ')[0]}`} />
                    <div>
                      <p className="text-sm font-medium">System Status</p>
                      <Badge className={getStatusColor(systemMetrics.systemStatus)}>
                        {systemMetrics.systemStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className={`h-8 w-8 mx-auto mb-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <p className="text-gray-500">Loading system metrics...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {systemMetrics?.errors && systemMetrics.errors.length > 0 ? (
                <div className="space-y-2">
                  {systemMetrics.errors.map((error: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-red-50 border border-red-200 rounded">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51RealTimeMonitor;
