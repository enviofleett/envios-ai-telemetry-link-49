
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Activity, Zap } from 'lucide-react';

interface ConnectionTestResult {
  success: boolean;
  error?: string;
  details?: string;
  data?: {
    total_devices: number;
    total_positions: number;
    fetched_at: string;
  };
}

const GP51ConnectionTester: React.FC = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isFetchingLiveData, setIsFetchingLiveData] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ConnectionTestResult | null>(null);
  const [lastLiveDataResult, setLastLiveDataResult] = useState<ConnectionTestResult | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      console.log('🔧 Testing GP51 connection...');
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        const result = { success: false, error: error.message };
        setLastTestResult(result);
        toast({
          title: "Connection Test Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.success) {
        const result = { 
          success: true, 
          details: `Connected as ${data.username || 'unknown user'}` 
        };
        setLastTestResult(result);
        toast({
          title: "Connection Test Successful",
          description: `GP51 API is responding correctly`,
        });
      } else {
        const result = { 
          success: false, 
          error: data.error || 'Connection test failed',
          details: data.details 
        };
        setLastTestResult(result);
        toast({
          title: "Connection Test Failed",
          description: data.error || "GP51 API connection failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      const result = { 
        success: false, 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastTestResult(result);
      toast({
        title: "Connection Test Error",
        description: "Failed to test GP51 connection",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const fetchLiveData = async () => {
    setIsFetchingLiveData(true);
    try {
      console.log('📡 Fetching live GP51 data...');
      
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: {}
      });

      if (error) {
        const result = { success: false, error: error.message };
        setLastLiveDataResult(result);
        toast({
          title: "Live Data Fetch Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.success) {
        const result = { 
          success: true, 
          data: data.data,
          details: `Fetched ${data.data.total_positions} positions from ${data.data.total_devices} devices`
        };
        setLastLiveDataResult(result);
        toast({
          title: "Live Data Fetched Successfully",
          description: `Retrieved data for ${data.data.total_devices} devices`,
        });
      } else {
        const result = { 
          success: false, 
          error: data.error || 'Live data fetch failed',
          details: data.details 
        };
        setLastLiveDataResult(result);
        toast({
          title: "Live Data Fetch Failed",
          description: data.error || "Failed to fetch live data",
          variant: "destructive"
        });
      }
    } catch (error) {
      const result = { 
        success: false, 
        error: 'Fetch failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastLiveDataResult(result);
      toast({
        title: "Live Data Error",
        description: "Failed to fetch live GP51 data",
        variant: "destructive"
      });
    } finally {
      setIsFetchingLiveData(false);
    }
  };

  const getStatusBadge = (result: ConnectionTestResult | null, isLoading: boolean) => {
    if (isLoading) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Testing...
        </Badge>
      );
    }

    if (!result) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Not Tested
        </Badge>
      );
    }

    if (result.success) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Success
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          GP51 Connection Testing
        </CardTitle>
        <CardDescription>
          Test your GP51 integration and verify live data connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">API Connection Test</h4>
              {getStatusBadge(lastTestResult, isTestingConnection)}
            </div>
            <Button 
              onClick={testConnection}
              disabled={isTestingConnection}
              variant="outline"
              size="sm"
            >
              {isTestingConnection ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>

          {lastTestResult && (
            <Alert variant={lastTestResult.success ? "default" : "destructive"}>
              <AlertDescription>
                {lastTestResult.success ? (
                  <span className="text-green-700">
                    ✅ {lastTestResult.details || 'Connection successful'}
                  </span>
                ) : (
                  <span>
                    ❌ {lastTestResult.error}
                    {lastTestResult.details && (
                      <div className="text-sm mt-1 opacity-80">
                        {lastTestResult.details}
                      </div>
                    )}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Live Data Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Live Data Fetch Test</h4>
              {getStatusBadge(lastLiveDataResult, isFetchingLiveData)}
            </div>
            <Button 
              onClick={fetchLiveData}
              disabled={isFetchingLiveData}
              variant="outline"
              size="sm"
            >
              {isFetchingLiveData ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Fetch Live Data
            </Button>
          </div>

          {lastLiveDataResult && (
            <Alert variant={lastLiveDataResult.success ? "default" : "destructive"}>
              <AlertDescription>
                {lastLiveDataResult.success ? (
                  <div className="text-green-700">
                    <span>✅ {lastLiveDataResult.details}</span>
                    {lastLiveDataResult.data && (
                      <div className="text-sm mt-2 space-y-1">
                        <div>Devices found: {lastLiveDataResult.data.total_devices}</div>
                        <div>Positions retrieved: {lastLiveDataResult.data.total_positions}</div>
                        <div>Last updated: {new Date(lastLiveDataResult.data.fetched_at).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span>
                    ❌ {lastLiveDataResult.error}
                    {lastLiveDataResult.details && (
                      <div className="text-sm mt-1 opacity-80">
                        {lastLiveDataResult.details}
                      </div>
                    )}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Testing Guide:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>First test the API connection to verify credentials</li>
            <li>Then test live data fetch to ensure full integration works</li>
            <li>Both tests should pass for complete GP51 functionality</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51ConnectionTester;
