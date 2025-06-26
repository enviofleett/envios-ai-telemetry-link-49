
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Trash2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Activity,
  Shield,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { improvedUnifiedGP51Service } from '@/services/gp51/improvedUnifiedGP51Service';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
  healthStatus?: any;
  recommendations?: string[];
  duration?: number;
}

export const ImprovedGP51ConnectionTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testProgress, setTestProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const { toast } = useToast();

  const runComprehensiveTest = async () => {
    setIsLoading(true);
    setTestProgress(0);
    setCurrentTest('Initializing...');
    
    const startTime = Date.now();

    try {
      // Test 1: Connection Test
      setCurrentTest('Testing connection...');
      setTestProgress(25);
      
      const connectionResult = await improvedUnifiedGP51Service.testConnection();
      
      if (!connectionResult.success) {
        throw new Error(connectionResult.error || 'Connection test failed');
      }

      // Test 2: Health Check
      setCurrentTest('Running health check...');
      setTestProgress(50);
      
      const healthStatus = await improvedUnifiedGP51Service.getConnectionHealth();

      // Test 3: Session Validation
      setCurrentTest('Validating session...');
      setTestProgress(75);
      
      const isValid = improvedUnifiedGP51Service.isSessionValid();
      const currentSession = improvedUnifiedGP51Service.getCurrentSession();

      // Test 4: Finalizing
      setCurrentTest('Finalizing results...');
      setTestProgress(100);

      const duration = Date.now() - startTime;
      const recommendations: string[] = [];

      // Generate recommendations based on test results
      if (!isValid) {
        recommendations.push('Session is invalid - re-authentication required');
      }
      
      if (healthStatus.expiringSoon > 0) {
        recommendations.push('Session expires soon - consider refreshing');
      }
      
      if (!healthStatus.isHealthy) {
        recommendations.push(...healthStatus.recommendations);
      }

      const result: TestResult = {
        success: connectionResult.success && isValid,
        message: isValid ? 
          'GP51 connection is working properly with valid session' : 
          'Connection available but session needs attention',
        details: {
          connection: connectionResult.success,
          session: {
            valid: isValid,
            username: currentSession?.username,
            expiresAt: currentSession?.expiresAt,
            lastActivity: currentSession?.lastActivity
          },
          health: healthStatus
        },
        healthStatus,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        timestamp: new Date(),
        duration
      };

      setTestResult(result);

      toast({
        title: result.success ? "Connection Test Passed" : "Connection Issues Detected",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });

    } catch (error) {
      console.error('❌ Comprehensive test failed:', error);
      
      const duration = Date.now() - startTime;
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { exception: true, error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        duration,
        recommendations: ['Check GP51 credentials', 'Verify network connectivity', 'Review error logs']
      });

      toast({
        title: "Test Failed",
        description: "Comprehensive connection test encountered an error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setTestProgress(0);
      setCurrentTest('');
    }
  };

  const clearSessions = async () => {
    setIsLoading(true);
    
    try {
      await improvedUnifiedGP51Service.disconnect();
      setTestResult(null);
      
      toast({
        title: "Sessions Cleared",
        description: "All GP51 sessions have been cleared. Please re-authenticate.",
      });
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear sessions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    setIsLoading(true);
    
    try {
      const result = await improvedUnifiedGP51Service.refreshSession();
      
      if (result.success) {
        toast({
          title: "Session Refresh",
          description: result.requiresReauth ? 
            "Session refresh initiated - re-authentication required" :
            "Session refreshed successfully",
          variant: result.requiresReauth ? "destructive" : "default"
        });
      } else {
        toast({
          title: "Refresh Failed",
          description: result.error || "Session refresh failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
    if (testResult?.success) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (testResult && !testResult.success) return <XCircle className="h-5 w-5 text-red-600" />;
    return <Wifi className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return currentTest || 'Testing Connection...';
    if (testResult?.success) return 'Connection Healthy';
    if (testResult && !testResult.success) return 'Issues Detected';
    return 'Not Tested';
  };

  const getHealthBadge = () => {
    if (isLoading) return <Badge variant="outline">Testing...</Badge>;
    if (!testResult) return <Badge variant="secondary">Unknown</Badge>;
    
    if (testResult.success) {
      return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
    } else if (testResult.details?.connection) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Degraded</Badge>;
    } else {
      return <Badge variant="destructive">Offline</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Improved GP51 Connection Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{getStatusText()}</p>
              {testResult && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last tested: {testResult.timestamp.toLocaleTimeString()}</span>
                  {testResult.duration && (
                    <>
                      <span>•</span>
                      <Zap className="h-3 w-3" />
                      <span>{testResult.duration}ms</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {getHealthBadge()}
        </div>

        {/* Progress Bar */}
        {isLoading && testProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{currentTest}</span>
              <span>{testProgress}%</span>
            </div>
            <Progress value={testProgress} className="h-2" />
          </div>
        )}

        {/* Test Results */}
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p><strong>Status:</strong> {testResult.message}</p>
                
                {testResult.details?.session && (
                  <div>
                    <strong>Session Details:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                      <li>Valid: {testResult.details.session.valid ? '✓' : '✗'}</li>
                      {testResult.details.session.username && (
                        <li>Username: {testResult.details.session.username}</li>
                      )}
                      {testResult.details.session.expiresAt && (
                        <li>Expires: {new Date(testResult.details.session.expiresAt).toLocaleString()}</li>
                      )}
                    </ul>
                  </div>
                )}

                {testResult.healthStatus && (
                  <div>
                    <strong>Health Status:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                      <li>Overall Health: {testResult.healthStatus.isHealthy ? 'Healthy' : 'Issues Detected'}</li>
                      <li>Valid Sessions: {testResult.healthStatus.validSessions}</li>
                      <li>Expiring Soon: {testResult.healthStatus.expiringSoon}</li>
                    </ul>
                  </div>
                )}

                {testResult.recommendations && (
                  <div>
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                      {testResult.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runComprehensiveTest}
            disabled={isLoading}
            variant="outline"
          >
            <Activity className={`h-4 w-4 mr-2 ${isLoading ? 'animate-pulse' : ''}`} />
            Run Comprehensive Test
          </Button>

          <Button
            onClick={refreshSession}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Session
          </Button>

          <Button
            onClick={clearSessions}
            disabled={isLoading}
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-pulse' : ''}`} />
            Clear Sessions
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <div className="flex items-center gap-2 font-medium text-sm mb-2">
            <Shield className="h-4 w-4" />
            Enhanced Testing Features
          </div>
          <p>• <strong>Comprehensive Test:</strong> Validates connection, health, and session status</p>
          <p>• <strong>Refresh Session:</strong> Intelligently refreshes or marks for re-authentication</p>
          <p>• <strong>Clear Sessions:</strong> Removes all stored sessions (requires re-authentication)</p>
          <p>• <strong>Real-time Monitoring:</strong> Tracks session health and provides recommendations</p>
        </div>
      </CardContent>
    </Card>
  );
};
