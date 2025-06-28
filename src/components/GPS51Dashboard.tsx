
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51HealthStatus } from '@/types/gp51-unified';
import { createDefaultHealthStatus } from '@/types/gp51-unified';

const GPS51Dashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus>(createDefaultHealthStatus());
  const [isLoading, setIsLoading] = useState(false);

  const checkHealth = async () => {
    setIsLoading(true);
    
    try {
      const status = await gp51DataService.getHealthStatus();
      setHealthStatus(status);
    } catch (error) {
      const errorStatus = createDefaultHealthStatus();
      setHealthStatus({
        ...errorStatus,
        error: error instanceof Error ? error.message : 'Health check failed',
        errorMessage: error instanceof Error ? error.message : 'Health check failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const queryDevices = async () => {
    try {
      const result = await gp51DataService.queryMonitorList();
      console.log('Query result:', result);
    } catch (error) {
      console.error('Query failed:', error);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
    if (healthStatus.isConnected) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusColor = () => {
    if (healthStatus.isConnected) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">GPS51 Dashboard</h1>
        <Button onClick={checkHealth} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className={getStatusColor()}>
                {healthStatus.status.toUpperCase()}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Last Check: {new Date(healthStatus.lastCheck).toLocaleTimeString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Response Time: {healthStatus.responseTime || 0}ms
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus.errorCount}</div>
            {healthStatus.errorMessage && (
              <div className="text-sm text-red-600 mt-2">
                {healthStatus.errorMessage}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStatus.activeDevices || 0}</div>
            <div className="text-sm text-muted-foreground">
              Token Valid: {healthStatus.tokenValid ? 'Yes' : 'No'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={queryDevices} variant="outline">
              Query Monitor List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51Dashboard;
