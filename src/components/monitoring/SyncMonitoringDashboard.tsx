
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database,
  Wifi,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { liveDataMonitor } from '@/services/monitoring/liveDataMonitor';
import { DetailedSyncMetrics } from '@/services/vehiclePosition/detailedSyncMetrics';

const SyncMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DetailedSyncMetrics | null>(null);

  useEffect(() => {
    // Subscribe to metrics updates
    const unsubscribe = liveDataMonitor.subscribe(setMetrics);
    
    // Get initial metrics
    setMetrics(liveDataMonitor.getMetrics());
    
    return unsubscribe;
  }, []);

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Loading monitoring data...</p>
        </CardContent>
      </Card>
    );
  }

  const successRate = liveDataMonitor.getSuccessRate();
  const dataQualityScore = liveDataMonitor.getDataQualityScore();
  
  const getHealthStatus = () => {
    if (successRate > 0.9 && dataQualityScore > 90) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (successRate > 0.8 && dataQualityScore > 75) return { text: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (successRate > 0.6 && dataQualityScore > 50) return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Overall Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge className={healthStatus.color}>
            {healthStatus.text}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Success: {(successRate * 100).toFixed(1)}% | Quality: {dataQualityScore.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* Timestamp Conversions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Timestamp Processing</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {metrics.timestampConversions.successful}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{metrics.timestampConversions.scientificNotationHandled} scientific</span>
            <span>•</span>
            <span>{metrics.timestampConversions.failed} failed</span>
          </div>
          {metrics.timestampConversions.total > 0 && (
            <Progress 
              value={(metrics.timestampConversions.successful / metrics.timestampConversions.total) * 100} 
              className="mt-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Position Validation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Position Validation</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.positionValidation.validPositions}
          </div>
          <div className="text-xs text-muted-foreground">
            of {metrics.positionValidation.totalPositions} total
          </div>
          {metrics.positionValidation.totalPositions > 0 && (
            <Progress 
              value={(metrics.positionValidation.validPositions / metrics.positionValidation.totalPositions) * 100} 
              className="mt-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Database Operations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database Updates</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {metrics.databaseOps.successful}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{metrics.databaseOps.failed} failed</span>
            <span>•</span>
            <span>{metrics.databaseOps.totalAttempts} total</span>
          </div>
          {metrics.databaseOps.totalAttempts > 0 && (
            <Progress 
              value={(metrics.databaseOps.successful / metrics.databaseOps.totalAttempts) * 100} 
              className="mt-2"
            />
          )}
        </CardContent>
      </Card>

      {/* Data Freshness */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Data Freshness Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{metrics.dataFreshness.live}</div>
              <div className="text-xs text-muted-foreground">Live</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{metrics.dataFreshness.recent}</div>
              <div className="text-xs text-muted-foreground">Recent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{metrics.dataFreshness.stale}</div>
              <div className="text-xs text-muted-foreground">Stale</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{metrics.dataFreshness.offline}</div>
              <div className="text-xs text-muted-foreground">Offline</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {metrics.performance.averageLatency.toFixed(0)}ms
          </div>
          <p className="text-xs text-muted-foreground">
            Avg sync latency
          </p>
          <div className="text-sm text-muted-foreground mt-1">
            Last: {metrics.performance.lastSyncDuration.toFixed(0)}ms
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-red-600">
            {metrics.errors.recentErrors.length}
          </div>
          <p className="text-xs text-muted-foreground">
            in last batch
          </p>
          {metrics.errors.recentErrors.length > 0 && (
            <div className="mt-2 space-y-1">
              {metrics.errors.recentErrors.slice(0, 2).map((error, index) => (
                <div key={index} className="text-xs text-red-600 truncate">
                  {error}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncMonitoringDashboard;
