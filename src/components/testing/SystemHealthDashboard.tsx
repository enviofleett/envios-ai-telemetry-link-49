
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  Database,
  Wifi,
  Monitor,
  TrendingUp
} from 'lucide-react';
import { pipelineTestService } from '@/services/testing/pipelineTestService';

const SystemHealthDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    // Load initial data
    loadTestData();
    
    // Start continuous monitoring
    pipelineTestService.runContinuousMonitoring();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadTestData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadTestData = () => {
    setTestResults(pipelineTestService.getTestResults());
    setHealthStatus(pipelineTestService.getHealthStatus());
  };

  const runManualTest = async () => {
    setIsRunningTest(true);
    try {
      await pipelineTestService.runEndToEndTest();
      loadTestData();
    } catch (error) {
      console.error('Manual test failed:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case 'poor':
        return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTestIcon = (testName: string, success: boolean) => {
    const iconClass = success ? 'text-green-500' : 'text-red-500';
    
    switch (testName) {
      case 'GP51 API Connection':
        return <Wifi className={`h-4 w-4 ${iconClass}`} />;
      case 'Database Operations':
        return <Database className={`h-4 w-4 ${iconClass}`} />;
      case 'Frontend Data Display':
        return <Monitor className={`h-4 w-4 ${iconClass}`} />;
      case 'Performance Metrics':
        return <TrendingUp className={`h-4 w-4 ${iconClass}`} />;
      default:
        return success ? 
          <CheckCircle className={`h-4 w-4 ${iconClass}`} /> : 
          <XCircle className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  if (!healthStatus) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading system health data...</p>
        </CardContent>
      </Card>
    );
  }

  const recentTests = testResults.slice(-5); // Show last 5 tests
  const successRate = testResults.length > 0 ? 
    (testResults.filter(t => t.success).length / testResults.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Overview
          </CardTitle>
          <Button 
            onClick={runManualTest} 
            disabled={isRunningTest}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningTest ? 'animate-spin' : ''}`} />
            {isRunningTest ? 'Testing...' : 'Run Test'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {getHealthBadge(healthStatus.overall)}
              </div>
              <p className="text-sm text-muted-foreground">Overall Status</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {successRate.toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <Progress value={successRate} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {getPerformanceBadge(healthStatus.syncPerformance)}
              </div>
              <p className="text-sm text-muted-foreground">Performance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                <Badge className={
                  healthStatus.dataFreshness === 'current' ? 'bg-green-100 text-green-800' :
                  healthStatus.dataFreshness === 'stale' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {healthStatus.dataFreshness}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Data Freshness</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Status */}
      <Card>
        <CardHeader>
          <CardTitle>Component Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span>GP51 Connection</span>
              </div>
              {healthStatus.gp51Connection ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Database</span>
              </div>
              {healthStatus.databaseConnection ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getTestIcon(test.testName, test.success)}
                  <div>
                    <div className="font-medium">{test.testName}</div>
                    <div className="text-sm text-muted-foreground">{test.details}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{test.duration}ms</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(test.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(healthStatus.lastTestTime).toLocaleString()}
      </div>
    </div>
  );
};

export default SystemHealthDashboard;
