
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Activity,
  Gauge,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { liveDataMonitor } from '@/services/monitoring/liveDataMonitor';
import { performanceOptimizer } from '@/services/optimization/performanceOptimizer';

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = liveDataMonitor.getMetrics();
      const successRate = liveDataMonitor.getSuccessRate();
      const dataQuality = liveDataMonitor.getDataQualityScore();
      
      setMetrics(currentMetrics);
      setPerformanceData({
        successRate,
        dataQuality,
        avgLatency: currentMetrics.performance.averageLatency,
        lastSyncDuration: currentMetrics.performance.lastSyncDuration
      });
    };

    // Initial load
    updateMetrics();
    
    // Subscribe to metrics updates
    const unsubscribe = liveDataMonitor.subscribe(updateMetrics);
    
    // Update every 10 seconds
    const interval = setInterval(updateMetrics, 10000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!metrics || !performanceData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading performance metrics...</p>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceStatus = () => {
    if (performanceData.successRate > 0.9 && performanceData.dataQuality > 90) {
      return { status: 'excellent', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (performanceData.successRate > 0.7 && performanceData.dataQuality > 70) {
      return { status: 'good', color: 'bg-blue-100 text-blue-800', icon: TrendingUp };
    } else {
      return { status: 'needs attention', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    }
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Overall Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance Status</CardTitle>
          <performanceStatus.icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge className={performanceStatus.color}>
            {performanceStatus.status}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Based on success rate and data quality
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {(performanceData.successRate * 100).toFixed(1)}%
          </div>
          <Progress value={performanceData.successRate * 100} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Database operations success rate
          </p>
        </CardContent>
      </Card>

      {/* Data Quality */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {performanceData.dataQuality.toFixed(1)}%
          </div>
          <Progress value={performanceData.dataQuality} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Valid position data percentage
          </p>
        </CardContent>
      </Card>

      {/* Average Latency */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {performanceData.avgLatency.toFixed(0)}ms
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Last sync: {performanceData.lastSyncDuration.toFixed(0)}ms
          </p>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Detailed Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Timestamp Conversions</div>
              <div className="text-green-600">
                ✅ {metrics.timestampConversions.successful}
              </div>
              <div className="text-red-600">
                ❌ {metrics.timestampConversions.failed}
              </div>
              <div className="text-blue-600">
                🔬 {metrics.timestampConversions.scientificNotationHandled} scientific
              </div>
            </div>
            
            <div>
              <div className="font-medium">Position Validation</div>
              <div className="text-green-600">
                ✅ {metrics.positionValidation.validPositions}
              </div>
              <div className="text-red-600">
                ❌ {metrics.positionValidation.invalidPositions}
              </div>
              <div className="text-yellow-600">
                ⚠️ {metrics.positionValidation.stalePositions} stale
              </div>
            </div>
            
            <div>
              <div className="font-medium">Data Freshness</div>
              <div className="text-green-600">
                🟢 {metrics.dataFreshness.live} live
              </div>
              <div className="text-blue-600">
                🔵 {metrics.dataFreshness.recent} recent
              </div>
              <div className="text-yellow-600">
                🟡 {metrics.dataFreshness.stale} stale
              </div>
              <div className="text-red-600">
                🔴 {metrics.dataFreshness.offline} offline
              </div>
            </div>
            
            <div>
              <div className="font-medium">System Errors</div>
              <div className="text-red-600">
                API: {metrics.errors.apiErrors}
              </div>
              <div className="text-red-600">
                DB: {metrics.errors.databaseErrors}
              </div>
              <div className="text-red-600">
                Validation: {metrics.errors.validationErrors}
              </div>
              <div className="text-red-600">
                Recent: {metrics.errors.recentErrors.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;
