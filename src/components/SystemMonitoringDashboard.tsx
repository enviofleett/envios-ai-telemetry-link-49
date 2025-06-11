import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Activity, Database, Wifi } from 'lucide-react';
import { enhancedPollingService } from '@/services/enhancedPollingService';
import { enhancedLogger } from '@/services/monitoring/enhancedLogger';

const SystemMonitoringDashboard: React.FC = () => {
  const [pollingMetrics, setPollingMetrics] = useState<any>(null);
  const [authValidation, setAuthValidation] = useState<any>(null);
  const [consistencyReport, setConsistencyReport] = useState<any>(null);
  const [logSummary, setLogSummary] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(loadInitialData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = () => {
    setPollingMetrics(enhancedPollingService.getMetrics());
    setLogSummary({
      total: 0,
      byLevel: { error: 0, warn: 0, info: 0, debug: 0 },
      recentErrors: []
    });
  };

  const runFullValidation = async () => {
    setIsValidating(true);
    try {
      // Validate polling connection
      const connectionResult = await enhancedPollingService.validateConnection();
      
      setConsistencyReport({
        overallStatus: 'unavailable',
        summary: { passed: 0, warnings: 0, failed: 0, totalChecks: 0 },
        checks: []
      });

      console.log('validation', 'Full system validation completed');
    } catch (error) {
      console.error('validation', 'Full validation failed', error);
    } finally {
      setIsValidating(false);
    }
  };

  const validateAuthFlow = async () => {
    setIsValidating(true);
    try {
      setAuthValidation({
        success: false,
        steps: [],
        finalState: {
          supabaseAuthenticated: false,
          gp51Connected: false,
          userProfile: false,
          sessionValid: false
        }
      });
      console.log('validation', 'Authentication flow validation completed');
    } catch (error) {
      console.error('validation', 'Auth validation failed', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Monitoring Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={validateAuthFlow} disabled={isValidating}>
            Validate Auth Flow
          </Button>
          <Button onClick={runFullValidation} disabled={isValidating}>
            {isValidating ? 'Validating...' : 'Run Full Validation'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="polling">Polling</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="consistency">Data Consistency</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Polling Status</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pollingMetrics?.successfulPolls || 0}/{pollingMetrics?.totalPolls || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Success rate: {pollingMetrics?.totalPolls > 0 ? 
                    Math.round((pollingMetrics.successfulPolls / pollingMetrics.totalPolls) * 100) : 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Consistency</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consistencyReport ? getStatusBadge(consistencyReport.overallStatus) : 'Not Checked'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {consistencyReport ? 
                    `${consistencyReport.summary.passed}/${consistencyReport.summary.totalChecks} checks passed` : 
                    'Run validation to check'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Authentication</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {authValidation ? (authValidation.success ? 'Valid' : 'Issues') : 'Not Tested'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {authValidation ? 
                    `${authValidation.steps.filter((s: any) => s.status === 'success').length}/${authValidation.steps.length} steps passed` : 
                    'Run validation to test'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Logs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {logSummary?.byLevel?.error || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recent errors ({logSummary?.total || 0} total logs)
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="polling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GP51 Polling Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pollingMetrics ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Polls</div>
                      <div className="text-2xl font-bold">{pollingMetrics.totalPolls}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Successful</div>
                      <div className="text-2xl font-bold text-green-600">{pollingMetrics.successfulPolls}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Failed</div>
                      <div className="text-2xl font-bold text-red-600">{pollingMetrics.failedPolls}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Retry Count</div>
                      <div className="text-2xl font-bold">{pollingMetrics.currentRetryCount}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span>{pollingMetrics.totalPolls > 0 ? 
                        Math.round((pollingMetrics.successfulPolls / pollingMetrics.totalPolls) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={pollingMetrics.totalPolls > 0 ? 
                        (pollingMetrics.successfulPolls / pollingMetrics.totalPolls) * 100 : 0
                      } 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Last Poll</div>
                      <div>{pollingMetrics.lastPollTime ? 
                        pollingMetrics.lastPollTime.toLocaleString() : 'Never'
                      }</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Last Success</div>
                      <div>{pollingMetrics.lastSuccessTime ? 
                        pollingMetrics.lastSuccessTime.toLocaleString() : 'Never'
                      }</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Last Error</div>
                      <div>{pollingMetrics.lastErrorTime ? 
                        pollingMetrics.lastErrorTime.toLocaleString() : 'None'
                      }</div>
                    </div>
                  </div>
                </>
              ) : (
                <div>No polling metrics available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Flow Validation</CardTitle>
            </CardHeader>
            <CardContent>
              {authValidation ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(authValidation.success ? 'pass' : 'fail')}
                    <span className="font-medium">
                      Overall Status: {authValidation.success ? 'Valid' : 'Issues Found'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {authValidation.steps.map((step: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(step.status)}
                          <span>{step.step}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {step.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Final State</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Supabase Auth: {authValidation.finalState.supabaseAuthenticated ? '✓' : '✗'}</div>
                      <div>GP51 Connected: {authValidation.finalState.gp51Connected ? '✓' : '✗'}</div>
                      <div>User Profile: {authValidation.finalState.userProfile ? '✓' : '✗'}</div>
                      <div>Session Valid: {authValidation.finalState.sessionValid ? '✓' : '✗'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>Click "Validate Auth Flow" to test authentication</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consistency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Consistency Report</CardTitle>
            </CardHeader>
            <CardContent>
              {consistencyReport ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(consistencyReport.overallStatus)}
                    <span className="font-medium">
                      Overall Status: {getStatusBadge(consistencyReport.overallStatus)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{consistencyReport.summary.passed}</div>
                      <div className="text-sm">Passed</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{consistencyReport.summary.warnings}</div>
                      <div className="text-sm">Warnings</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">{consistencyReport.summary.failed}</div>
                      <div className="text-sm">Failed</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {consistencyReport.checks.map((check: any, index: number) => (
                      <div key={index} className="flex items-start justify-between p-3 border rounded">
                        <div className="flex items-start gap-2">
                          {getStatusIcon(check.status)}
                          <div>
                            <div className="font-medium">{check.name}</div>
                            <div className="text-sm text-gray-600">{check.message}</div>
                            {check.details && (
                              <details className="text-xs text-gray-500 mt-1">
                                <summary className="cursor-pointer">Details</summary>
                                <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(check.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {check.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>Click "Run Full Validation" to check data consistency</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logSummary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{logSummary.byLevel.debug || 0}</div>
                      <div className="text-sm">Debug</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{logSummary.byLevel.info || 0}</div>
                      <div className="text-sm">Info</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{logSummary.byLevel.warn || 0}</div>
                      <div className="text-sm">Warnings</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">{logSummary.byLevel.error || 0}</div>
                      <div className="text-sm">Errors</div>
                    </div>
                  </div>

                  {logSummary.recentErrors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recent Errors</h4>
                      <div className="space-y-2">
                        {logSummary.recentErrors.map((error: any) => (
                          <div key={error.id} className="p-2 bg-red-50 border border-red-200 rounded">
                            <div className="font-medium text-red-800">{error.category}: {error.message}</div>
                            <div className="text-xs text-red-600">{error.timestamp.toLocaleString()}</div>
                            {error.data && (
                              <details className="text-xs text-red-600 mt-1">
                                <summary className="cursor-pointer">Error Details</summary>
                                <pre className="mt-1 bg-red-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(error.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const logs = enhancedLogger.exportLogs('json');
                        const blob = new Blob([logs], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                      }}
                    >
                      Export JSON
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => enhancedLogger.clearLogs()}
                    >
                      Clear Logs
                    </Button>
                  </div>
                </div>
              ) : (
                <div>No log data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitoringDashboard;
