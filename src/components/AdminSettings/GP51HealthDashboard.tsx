
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  Wifi,
  Car,
  Clock
} from 'lucide-react';
import { gp51HealthMonitor } from '@/services/gp51HealthMonitor';
import { useToast } from '@/hooks/use-toast';

interface HealthCheckResult {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
  checks: {
    gp51Connection: boolean;
    vehicleSync: boolean;
    databaseAccess: boolean;
    sessionValidity: boolean;
  };
  metrics: {
    totalVehicles: number;
    activeVehicles: number;
    lastSyncTime?: Date;
    sessionExpiresAt?: Date;
  };
  errors: string[];
}

const GP51HealthDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to health monitor updates
    const unsubscribe = gp51HealthMonitor.subscribe((result) => {
      setHealthStatus(result);
    });

    // Perform initial health check
    performHealthCheck();

    return unsubscribe;
  }, []);

  const performHealthCheck = async () => {
    setIsChecking(true);
    try {
      await gp51HealthMonitor.performHealthCheck();
    } catch (error) {
      toast({
        title: 'Health Check Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const triggerVehicleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await gp51HealthMonitor.triggerVehicleSync();
      toast({
        title: result.success ? 'Sync Successful' : 'Sync Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (isHealthy: boolean, isWarning: boolean = false) => {
    if (isHealthy) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (isWarning) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (!healthStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Health Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              GP51 Platform Health Status
              <Badge variant={getStatusColor(healthStatus.overall)}>
                {healthStatus.overall.toUpperCase()}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={performHealthCheck}
                disabled={isChecking}
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                Check Health
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={triggerVehicleSync}
                disabled={isSyncing || !healthStatus.checks.sessionValidity}
              >
                <Car className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Vehicles
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Checks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getStatusIcon(healthStatus.checks.sessionValidity)}
              <div>
                <div className="font-medium text-sm">Session</div>
                <div className="text-xs text-gray-500">
                  {healthStatus.checks.sessionValidity ? 'Valid' : 'Invalid'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getStatusIcon(healthStatus.checks.gp51Connection)}
              <div>
                <div className="font-medium text-sm">GP51 API</div>
                <div className="text-xs text-gray-500">
                  {healthStatus.checks.gp51Connection ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getStatusIcon(healthStatus.checks.databaseAccess)}
              <div>
                <div className="font-medium text-sm">Database</div>
                <div className="text-xs text-gray-500">
                  {healthStatus.checks.databaseAccess ? 'Accessible' : 'Error'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getStatusIcon(healthStatus.checks.vehicleSync, healthStatus.metrics.totalVehicles === 0)}
              <div>
                <div className="font-medium text-sm">Vehicles</div>
                <div className="text-xs text-gray-500">
                  {healthStatus.metrics.totalVehicles} total
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{healthStatus.metrics.activeVehicles}</div>
                    <div className="text-sm text-gray-500">Active Vehicles</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{healthStatus.metrics.totalVehicles}</div>
                    <div className="text-sm text-gray-500">Total Vehicles</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-sm font-bold">
                      {healthStatus.metrics.lastSyncTime 
                        ? healthStatus.metrics.lastSyncTime.toLocaleString()
                        : 'Never'
                      }
                    </div>
                    <div className="text-sm text-gray-500">Last Sync</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Expiry Warning */}
          {healthStatus.metrics.sessionExpiresAt && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Session expires: {healthStatus.metrics.sessionExpiresAt.toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          {/* Errors */}
          {healthStatus.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Issues detected:</div>
                <ul className="list-disc list-inside space-y-1">
                  {healthStatus.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-500">
            Last checked: {healthStatus.timestamp.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51HealthDashboard;
