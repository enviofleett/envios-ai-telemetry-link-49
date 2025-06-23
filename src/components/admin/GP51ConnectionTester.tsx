
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, CheckCircle, XCircle, AlertTriangle, Loader2, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
  timestamp: Date;
  latency?: string;
  deviceCount?: number;
}

const GP51ConnectionTester: React.FC = () => {
  const [connectionTest, setConnectionTest] = useState<TestResult | null>(null);
  const [apiTest, setApiTest] = useState<TestResult | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      let result: TestResult;
      if (error) {
        result = {
          success: false,
          message: 'Connection test failed',
          details: error.message,
          timestamp: new Date()
        };
        toast({
          title: "Connection Test Failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.success) {
        result = {
          success: true,
          message: `Connected as ${data.username}`,
          details: `Token valid until ${new Date(data.expiresAt).toLocaleString()}`,
          timestamp: new Date()
        };
        toast({
          title: "Connection Test Successful",
          description: `GP51 session is active for ${data.username}`
        });
      } else {
        result = {
          success: false,
          message: 'Connection test failed',
          details: data.error,
          timestamp: new Date()
        };
        toast({
          title: "Connection Test Failed",
          description: data.error,
          variant: "destructive"
        });
      }

      setConnectionTest(result);
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: 'Connection test error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      setConnectionTest(result);
      toast({
        title: "Connection Test Error",
        description: "Failed to perform connection test",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testAPI = async () => {
    setIsTestingAPI(true);
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_gp51_api' }
      });

      let result: TestResult;
      if (error) {
        result = {
          success: false,
          message: 'API test failed',
          details: error.message,
          timestamp: new Date()
        };
        toast({
          title: "API Test Failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.isValid) {
        result = {
          success: true,
          message: `API responding correctly`,
          details: `Connected as ${data.username}. ${data.deviceCount} devices available.`,
          timestamp: new Date(),
          latency: data.latency,
          deviceCount: data.deviceCount
        };
        toast({
          title: "API Test Successful",
          description: `GP51 API is responding correctly (${data.deviceCount} devices)`
        });
      } else {
        result = {
          success: false,
          message: 'API test failed',
          details: data.errorMessage || data.status,
          timestamp: new Date()
        };
        toast({
          title: "API Test Failed",
          description: data.errorMessage || "API test unsuccessful",
          variant: "destructive"
        });
      }

      setApiTest(result);
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: 'API test error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      setApiTest(result);
      toast({
        title: "API Test Error",
        description: "Failed to perform API test",
        variant: "destructive"
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const getResultIcon = (result: TestResult | null, isLoading: boolean) => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!result) return <Activity className="h-4 w-4 text-gray-400" />;
    return result.success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> :
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getResultBadge = (result: TestResult | null, isLoading: boolean) => {
    if (isLoading) return <Badge variant="secondary">Testing...</Badge>;
    if (!result) return <Badge variant="outline">Not Tested</Badge>;
    return result.success ? 
      <Badge className="bg-green-100 text-green-800">Success</Badge> :
      <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          GP51 Connection Testing
        </CardTitle>
        <CardDescription>
          Test your GP51 integration and verify API connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Session Connection Test</h4>
              {getResultIcon(connectionTest, isTestingConnection)}
              {getResultBadge(connectionTest, isTestingConnection)}
            </div>
            <Button
              onClick={testConnection}
              disabled={isTestingConnection}
              variant="outline"
              size="sm"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>
          
          {connectionTest && (
            <Alert className={connectionTest.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>
                <div className="font-medium">{connectionTest.message}</div>
                {connectionTest.details && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {connectionTest.details}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Tested at: {connectionTest.timestamp.toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* API Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">API Functionality Test</h4>
              {getResultIcon(apiTest, isTestingAPI)}
              {getResultBadge(apiTest, isTestingAPI)}
            </div>
            <Button
              onClick={testAPI}
              disabled={isTestingAPI || (connectionTest && !connectionTest.success)}
              variant="outline"
              size="sm"
            >
              {isTestingAPI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test API
                </>
              )}
            </Button>
          </div>
          
          {apiTest && (
            <Alert className={apiTest.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>
                <div className="font-medium">{apiTest.message}</div>
                {apiTest.details && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {apiTest.details}
                  </div>
                )}
                {apiTest.success && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {apiTest.latency && `Response time: ${apiTest.latency}`}
                    {apiTest.deviceCount !== undefined && ` • ${apiTest.deviceCount} devices available`}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Tested at: {apiTest.timestamp.toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Testing Guide:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>First, ensure you are authenticated with GP51 via the 'Authentication' section</li>
            <li>Run the 'Session Connection Test' to verify your credentials are stored and valid</li>
            <li>If successful, run the 'API Functionality Test' to verify data access</li>
            <li>Both tests should pass for complete GP51 functionality</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51ConnectionTester;
