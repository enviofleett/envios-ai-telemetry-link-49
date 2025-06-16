
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Loader2 } from 'lucide-react';
import { gp51HealthMonitor, type HealthMetrics } from '@/services/gp51HealthMonitor';
import type { HealthCheckResult } from '@/types/gp51ValidationTypes';

const GP51HealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to health metrics updates
    const unsubscribe = gp51HealthMonitor.subscribe((metrics: HealthMetrics) => {
      // Transform HealthMetrics to HealthCheckResult
      const healthResult: HealthCheckResult = {
        overall: {
          status: metrics.systemStatus,
          score: metrics.systemStatus === 'healthy' ? 100 : metrics.systemStatus === 'warning' ? 70 : 30
        },
        timestamp: new Date(),
        checks: {
          database: metrics.connectionStatus === 'connected',
          gp51Connection: metrics.connectionStatus === 'connected',
          dataSync: metrics.dataFreshness === 'fresh'
        },
        metrics: metrics
      };
      
      setHealthData(healthResult);
      setLastUpdate(new Date());
    });

    // Initial health check
    performHealthCheck();

    return () => {
      unsubscribe();
    };
  }, []);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const metrics = await gp51HealthMonitor.getHealthMetrics();
      // The subscriber will handle the update
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSync = async () => {
    setIsLoading(true);
    try {
      await gp51HealthMonitor.triggerVehicleSync();
    } catch (error) {
      console.error('Vehicle sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GP51 Health Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor GP51 integration health and system status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={performHealthCheck}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Health Check
          </Button>
          <Button
            onClick={triggerSync}
            disabled={isLoading}
          >
            <Database className="h-4 w-4 mr-2" />
            Sync Vehicles
          </Button>
        </div>
      </div>

      {lastUpdate && (
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {healthData && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(healthData.overall.status)}
                System Health Overview
                <Badge variant={getStatusBadgeVariant(healthData.overall.status)}>
                  {healthData.overall.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${healthData.checks.database ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm">Database: {healthData.checks.database ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${healthData.checks.gp51Connection ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm">GP51 API: {healthData.checks.gp51Connection ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${healthData.checks.dataSync ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm">Data Sync: {healthData.checks.dataSync ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{healthData.metrics.totalVehicles}</div>
                <p className="text-xs text-muted-foreground">Total Vehicles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{healthData.metrics.onlineVehicles}</div>
                <p className="text-xs text-muted-foreground">Online Vehicles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{healthData.metrics.activeVehicles}</div>
                <p className="text-xs text-muted-foreground">Active Vehicles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{healthData.metrics.errors.length}</div>
                <p className="text-xs text-muted-foreground">System Errors</p>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {healthData.metrics.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>System Errors Detected:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {healthData.metrics.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {isLoading && !healthData && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading health data...</span>
        </div>
      )}
    </div>
  );
};

export default GP51HealthDashboard;
