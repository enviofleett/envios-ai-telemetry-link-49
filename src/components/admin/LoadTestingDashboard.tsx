
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { LoadTestingFramework } from '@/services/performance/LoadTestingFramework';
import { Activity, Zap, Database, AlertTriangle, Play, Square } from 'lucide-react';

export const LoadTestingDashboard: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const loadTestingFramework = LoadTestingFramework.getInstance();

  const runLoadTest = async (testType: string) => {
    setIsRunning(true);
    setCurrentTest(testType);
    setProgress(0);
    
    try {
      let testResults;
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      switch (testType) {
        case 'gp51_auth':
          testResults = await loadTestingFramework.runGP51AuthenticationTest();
          break;
        case 'vehicle_sync':
          testResults = await loadTestingFramework.runVehiclePositionSyncTest();
          break;
        case 'database':
          testResults = await loadTestingFramework.runDatabasePerformanceTest();
          break;
        case 'full_system':
          testResults = await loadTestingFramework.runFullSystemLoadTest();
          break;
        default:
          throw new Error('Unknown test type');
      }

      clearInterval(progressInterval);
      setProgress(100);
      setResults(testResults);
      
      toast({
        title: "Load Test Completed",
        description: `${testType} test finished successfully`,
      });
    } catch (error) {
      console.error('Load test failed:', error);
      toast({
        title: "Load Test Failed",
        description: "Check console for details",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const stopTest = () => {
    setIsRunning(false);
    setCurrentTest(null);
    setProgress(0);
    toast({
      title: "Test Stopped",
      description: "Load test has been terminated",
    });
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value <= threshold) return 'secondary';
    if (value <= threshold * 1.5) return 'default';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Load Testing Dashboard</h2>
          <p className="text-muted-foreground">
            Performance testing and baseline establishment for GP51 API
          </p>
        </div>
        {isRunning && (
          <Button onClick={stopTest} variant="destructive">
            <Square className="h-4 w-4 mr-2" />
            Stop Test
          </Button>
        )}
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              GP51 Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runLoadTest('gp51_auth')}
              disabled={isRunning}
              className="w-full"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Vehicle Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runLoadTest('vehicle_sync')}
              disabled={isRunning}
              className="w-full"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runLoadTest('database')}
              disabled={isRunning}
              className="w-full"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Full System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runLoadTest('full_system')}
              disabled={isRunning}
              className="w-full"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicator */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Running: {currentTest?.replace('_', ' ').toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Progress: {progress}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Latest load test performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Average Response Time</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {results.averageResponseTime?.toFixed(0) || 0}ms
                  </span>
                  <Badge variant={getStatusColor(results.averageResponseTime || 0, 2000)}>
                    {results.averageResponseTime <= 2000 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Success Rate</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%
                  </span>
                  <Badge variant={getStatusColor(100 - ((results.successfulRequests / results.totalRequests) * 100), 5)}>
                    {(results.successfulRequests / results.totalRequests) >= 0.95 ? 'Excellent' : 'Review Required'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Throughput</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {results.requestsPerSecond?.toFixed(1) || 0}/s
                  </span>
                  <Badge variant={getStatusColor(50 - (results.requestsPerSecond || 0), -30)}>
                    {results.requestsPerSecond >= 20 ? 'Good' : 'Low'}
                  </Badge>
                </div>
              </div>
            </div>

            {results.recommendations?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {results.recommendations.map((rec: string, index: number) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Baselines */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Baselines</CardTitle>
          <CardDescription>
            Established performance targets for production monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">GP51 API Response Time</p>
              <p className="text-xs text-muted-foreground">Target: ≤ 2000ms, Critical: ≥ 5000ms</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Vehicle Sync Success Rate</p>
              <p className="text-xs text-muted-foreground">Target: ≥ 95%, Critical: ≤ 90%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Database Query Time</p>
              <p className="text-xs text-muted-foreground">Target: ≤ 1000ms, Critical: ≥ 3000ms</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Cache Hit Rate</p>
              <p className="text-xs text-muted-foreground">Target: ≥ 80%, Critical: ≤ 60%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
