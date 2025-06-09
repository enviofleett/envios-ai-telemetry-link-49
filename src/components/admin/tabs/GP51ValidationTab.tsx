
import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { gp51IntegrationTester, ValidationSuite, TestResult } from '@/services/gp51/integrationTester';
import { PlayCircle, CheckCircle, XCircle, AlertCircle, Loader2, Activity } from 'lucide-react';

export default function GP51ValidationTab() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ValidationSuite | null>(null);
  const [healthCheck, setHealthCheck] = useState<{ healthy: boolean; issues: string[] } | null>(null);
  const { toast } = useToast();

  const runFullValidation = async () => {
    setIsRunning(true);
    try {
      console.log('🧪 Starting full GP51 validation suite...');
      
      const validationResults = await gp51IntegrationTester.runFullValidationSuite();
      setResults(validationResults);
      
      toast({
        title: "Validation Complete",
        description: `${validationResults.overall.passedTests}/${validationResults.overall.totalTests} tests passed (${validationResults.overall.successRate}%)`,
        variant: validationResults.overall.successRate >= 80 ? "default" : "destructive"
      });
      
    } catch (error) {
      console.error('❌ Validation suite failed:', error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickHealthCheck = async () => {
    try {
      console.log('🏥 Running quick health check...');
      
      const health = await gp51IntegrationTester.runQuickHealthCheck();
      setHealthCheck(health);
      
      toast({
        title: health.healthy ? "System Healthy" : "Issues Detected",
        description: health.healthy ? "All systems operational" : `${health.issues.length} issues found`,
        variant: health.healthy ? "default" : "destructive"
      });
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      toast({
        title: "Health Check Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const getTestIcon = (test: TestResult) => {
    if (test.success) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getCategoryStatus = (tests: TestResult[]) => {
    if (tests.length === 0) return 'pending';
    const passed = tests.filter(t => t.success).length;
    if (passed === tests.length) return 'success';
    if (passed === 0) return 'error';
    return 'warning';
  };

  const getCategoryBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <TabsContent value="gp51-validation" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">GP51 Integration Validation</h3>
          <p className="text-sm text-muted-foreground">
            Test and validate GP51 integration components
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runQuickHealthCheck}
            disabled={isRunning}
          >
            <Activity className="h-4 w-4 mr-2" />
            Quick Health Check
          </Button>
          <Button
            onClick={runFullValidation}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Run Full Validation
              </>
            )}
          </Button>
        </div>
      </div>

      {healthCheck && (
        <Alert variant={healthCheck.healthy ? "default" : "destructive"}>
          {healthCheck.healthy ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <strong>System Health:</strong> {healthCheck.healthy ? 'All systems operational' : 'Issues detected'}
            {!healthCheck.healthy && (
              <ul className="mt-2 list-disc list-inside">
                {healthCheck.issues.map((issue, index) => (
                  <li key={index} className="text-sm">{issue}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Results</span>
                <Badge variant={results.overall.successRate >= 80 ? "default" : "destructive"}>
                  {results.overall.successRate}% Success Rate
                </Badge>
              </CardTitle>
              <CardDescription>
                {results.overall.passedTests} of {results.overall.totalTests} tests passed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Test Progress</span>
                  <span>{results.overall.passedTests}/{results.overall.totalTests}</span>
                </div>
                <Progress value={results.overall.successRate} className="w-full" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Credential Saving</span>
                  <Badge variant={getCategoryBadgeVariant(getCategoryStatus(results.credentialSaving))}>
                    {results.credentialSaving.filter(t => t.success).length}/{results.credentialSaving.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.credentialSaving.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getTestIcon(test)}
                      <span className="text-sm">{test.testName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{test.duration}ms</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Session Management</span>
                  <Badge variant={getCategoryBadgeVariant(getCategoryStatus(results.sessionManagement))}>
                    {results.sessionManagement.filter(t => t.success).length}/{results.sessionManagement.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.sessionManagement.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getTestIcon(test)}
                      <span className="text-sm">{test.testName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{test.duration}ms</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vehicle Data Sync</span>
                  <Badge variant={getCategoryBadgeVariant(getCategoryStatus(results.vehicleDataSync))}>
                    {results.vehicleDataSync.filter(t => t.success).length}/{results.vehicleDataSync.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.vehicleDataSync.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getTestIcon(test)}
                      <span className="text-sm">{test.testName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{test.duration}ms</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Error Recovery</span>
                  <Badge variant={getCategoryBadgeVariant(getCategoryStatus(results.errorRecovery))}>
                    {results.errorRecovery.filter(t => t.success).length}/{results.errorRecovery.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.errorRecovery.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getTestIcon(test)}
                      <span className="text-sm">{test.testName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{test.duration}ms</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {results.credentialSaving.concat(results.sessionManagement, results.vehicleDataSync, results.errorRecovery)
            .filter(test => !test.success).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Failed Tests</CardTitle>
                <CardDescription>
                  Tests that failed and require attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.credentialSaving.concat(results.sessionManagement, results.vehicleDataSync, results.errorRecovery)
                  .filter(test => !test.success)
                  .map((test, index) => (
                    <div key={index} className="p-3 border border-red-200 rounded bg-red-50">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-900">{test.testName}</span>
                      </div>
                      <p className="text-sm text-red-700">{test.error}</p>
                      <p className="text-xs text-red-600 mt-1">Duration: {test.duration}ms</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </TabsContent>
  );
}
