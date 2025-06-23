
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  latency?: number;
  timestamp: Date;
}

const GP51EndpointTester: React.FC = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingLiveData, setIsTestingLiveData] = useState(false);
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [liveDataResult, setLiveDataResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      console.log('🧪 Testing GP51 connection...');
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        const result: TestResult = {
          success: false,
          message: 'Connection test failed',
          details: error.message,
          timestamp: new Date()
        };
        setConnectionResult(result);
        toast({
          title: "Connection Test Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      const result: TestResult = {
        success: data?.isValid || false,
        message: data?.isValid ? 'Connection successful' : 'Connection failed',
        details: data,
        latency: data?.latency,
        timestamp: new Date()
      };

      setConnectionResult(result);
      
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: `Connected to GP51 as ${data.username || 'unknown user'}`
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: data?.errorMessage || 'Connection failed',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Connection test error:', error);
      const result: TestResult = {
        success: false,
        message: 'Test execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      setConnectionResult(result);
      toast({
        title: "Test Error",
        description: "Failed to execute connection test",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testLiveData = async () => {
    setIsTestingLiveData(true);
    try {
      console.log('📡 Testing live data fetch...');
      
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data');

      if (error) {
        const result: TestResult = {
          success: false,
          message: 'Live data test failed',
          details: error.message,
          timestamp: new Date()
        };
        setLiveDataResult(result);
        toast({
          title: "Live Data Test Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      const result: TestResult = {
        success: data?.success || false,
        message: data?.success ? 'Live data retrieved successfully' : 'Live data test failed',
        details: data,
        timestamp: new Date()
      };

      setLiveDataResult(result);
      
      if (result.success) {
        toast({
          title: "Live Data Test Successful",
          description: `Retrieved data for ${data.data?.total_devices || 0} devices`
        });
      } else {
        toast({
          title: "Live Data Test Failed",
          description: data?.error || 'Failed to retrieve live data',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Live data test error:', error);
      const result: TestResult = {
        success: false,
        message: 'Test execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      setLiveDataResult(result);
      toast({
        title: "Test Error",
        description: "Failed to execute live data test",
        variant: "destructive"
      });
    } finally {
      setIsTestingLiveData(false);
    }
  };

  const getStatusBadge = (result: TestResult | null, isLoading: boolean) => {
    if (isLoading) {
      return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Testing...</Badge>;
    }
    if (!result) {
      return <Badge variant="outline">Not Tested</Badge>;
    }
    if (result.success) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
  };

  const renderTestResult = (result: TestResult | null) => {
    if (!result) return null;

    return (
      <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
        {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        <AlertDescription>
          <div className="space-y-2">
            <div>{result.message}</div>
            {result.latency && (
              <div className="text-sm opacity-75">Latency: {result.latency}ms</div>
            )}
            {result.details && typeof result.details === 'object' && (
              <div className="text-xs font-mono bg-muted p-2 rounded mt-2 max-h-32 overflow-y-auto">
                {JSON.stringify(result.details, null, 2)}
              </div>
            )}
            <div className="text-xs opacity-60">
              Tested at: {result.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">GP51 Connection Test</h4>
            <p className="text-sm text-muted-foreground">Test basic connectivity and session validation</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(connectionResult, isTestingConnection)}
            <Button
              onClick={testConnection}
              disabled={isTestingConnection}
              variant="outline"
              size="sm"
            >
              {isTestingConnection ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>
        </div>
        {renderTestResult(connectionResult)}
      </div>

      {/* Live Data Test */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Live Data Fetch Test</h4>
            <p className="text-sm text-muted-foreground">Test actual data retrieval from GP51 API</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(liveDataResult, isTestingLiveData)}
            <Button
              onClick={testLiveData}
              disabled={isTestingLiveData || (!connectionResult?.success)}
              variant="outline"
              size="sm"
            >
              {isTestingLiveData ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Live Data
            </Button>
          </div>
        </div>
        {renderTestResult(liveDataResult)}
      </div>
    </div>
  );
};

export default GP51EndpointTester;
