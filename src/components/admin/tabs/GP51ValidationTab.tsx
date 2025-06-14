import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { gp51IntegrationTester } from '@/services/gp51/integrationTester';
import { PlayCircle, CheckCircle, XCircle, AlertCircle, Loader2, Activity } from 'lucide-react';
import { ValidationOverallCard } from './gp51/ValidationOverallCard';
import { ValidationCategoryCard } from './gp51/ValidationCategoryCard';
import { FailedTestsCard } from './gp51/FailedTestsCard';
import type { ValidationSuite, TestResult } from '@/services/gp51/gp51ValidationTypes';

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
    <div className="space-y-6">
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
          <ValidationOverallCard overall={results.overall} />

          <div className="grid gap-4 md:grid-cols-2">
            <ValidationCategoryCard label="Credential Saving" tests={results.credentialSaving} />
            <ValidationCategoryCard label="Session Management" tests={results.sessionManagement} />
            <ValidationCategoryCard label="Vehicle Data Sync" tests={results.vehicleDataSync} />
            <ValidationCategoryCard label="Error Recovery" tests={results.errorRecovery} />
          </div>

          <FailedTestsCard
            failedTests={
              results.credentialSaving
                .concat(
                  results.sessionManagement,
                  results.vehicleDataSync,
                  results.errorRecovery
                )
                .filter(test => !test.success)
            }
          />
        </>
      )}
    </div>
  );
}
