
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Activity, Zap, UserCircle, Clock } from 'lucide-react';
import { useGP51Auth } from '@/hooks/useGP51Auth';

interface ConnectionTestResult {
  success: boolean;
  error?: string;
  details?: string;
  data?: {
    total_devices: number;
    total_positions: number;
    fetched_at: string;
  };
  timestamp?: Date; // Added timestamp for consistency
}

const GP51ConnectionTester: React.FC = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isFetchingLiveData, setIsFetchingLiveData] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ConnectionTestResult | null>(null);
  const [lastLiveDataResult, setLastLiveDataResult] = useState<ConnectionTestResult | null>(null);
  
  const { toast } = useToast();
  const { 
    isAuthenticated: isGp51Authenticated, 
    username: gp51Username, 
    tokenExpiresAt: gp51TokenExpiresAt,
    healthCheck: gp51HealthCheck,
    isLoading: authLoading 
  } = useGP51Auth();

  const testConnection = async () => {
    setIsTestingConnection(true);
    setLastTestResult(null); // Clear previous result

    try {
      console.log('🔧 Testing GP51 connection phase 1: Client-side session health check...');
      const isSessionHealthy = await gp51HealthCheck();

      if (!isSessionHealthy || !isGp51Authenticated) {
        const errorMsg = 'GP51 session is not valid or has expired. Please re-authenticate in the Authentication tab.';
        setLastTestResult({ 
          success: false, 
          error: errorMsg,
          timestamp: new Date()
        });
        toast({
          title: "Session Check Failed",
          description: errorMsg,
          variant: "destructive"
        });
        setIsTestingConnection(false);
        return;
      }
      
      console.log('🔧 Testing GP51 connection phase 2: Edge function API test...');
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        const result = { success: false, error: error.message, timestamp: new Date() };
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
          details: `Connected as ${data.username || gp51Username || 'unknown user'}`,
          timestamp: new Date()
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
          details: data.details,
          timestamp: new Date()
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
        error: 'Test failed due to an unexpected error.',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
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
    setLastLiveDataResult(null); // Clear previous result
    try {
      if (!isGp51Authenticated) {
        const errorMsg = "Not authenticated with GP51. Please authenticate first.";
        setLastLiveDataResult({ success: false, error: errorMsg, timestamp: new Date() });
        toast({ title: "Authentication Required", description: errorMsg, variant: "destructive" });
        setIsFetchingLiveData(false);
        return;
      }

      console.log('📡 Fetching live GP51 data...');
      // Note: 'fetchLiveGp51Data' edge function should use the user's Supabase JWT 
      // to look up GP51 credentials server-side from 'gp51_sessions'.
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        // No body needed if it uses authenticated user context server-side
      });

      if (error) {
        const result = { success: false, error: error.message, timestamp: new Date() };
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
          details: `Fetched ${data.data.total_positions} positions from ${data.data.total_devices} devices`,
          timestamp: new Date()
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
          details: data.details,
          timestamp: new Date()
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
        error: 'Fetch failed due to an unexpected error.',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
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
          Test your GP51 integration and verify live data connectivity. 
          Session status is managed by the Authentication tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Status Display */}
        <div className="p-4 border rounded-md bg-muted/40">
          <h4 className="font-medium mb-2 text-lg">Current GP51 Session Status</h4>
          {authLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" /> Checking session status...
            </div>
          ) : isGp51Authenticated ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Authenticated</span>
              </div>
              {gp51Username && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCircle className="h-4 w-4" /> User: {gp51Username}
                </div>
              )}
              {gp51TokenExpiresAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> Session expires: {new Date(gp51TokenExpiresAt).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="font-medium">Not Authenticated</span>
              <span className="text-sm text-muted-foreground">Please login via the Authentication tab.</span>
            </div>
          )}
        </div>

        {/* Connection Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">API Connection Test</h4>
              {getStatusBadge(lastTestResult, isTestingConnection || authLoading)}
            </div>
            <Button 
              onClick={testConnection}
              disabled={isTestingConnection || authLoading || !isGp51Authenticated}
              variant="outline"
              size="sm"
            >
              {isTestingConnection || authLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>

          {lastTestResult && (
            <Alert variant={lastTestResult.success ? "default" : "destructive"}>
               {lastTestResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
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
                {lastTestResult.timestamp && <div className="text-xs text-muted-foreground mt-1">Tested at: {lastTestResult.timestamp.toLocaleTimeString()}</div>}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Live Data Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Live Data Fetch Test</h4>
              {getStatusBadge(lastLiveDataResult, isFetchingLiveData || authLoading)}
            </div>
            <Button 
              onClick={fetchLiveData}
              disabled={isFetchingLiveData || authLoading || !isGp51Authenticated || (lastTestResult && !lastTestResult.success)}
              variant="outline"
              size="sm"
            >
              {isFetchingLiveData || authLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Fetch Live Data
            </Button>
          </div>

          {lastLiveDataResult && (
            <Alert variant={lastLiveDataResult.success ? "default" : "destructive"}>
              {lastLiveDataResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
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
                {lastLiveDataResult.timestamp && <div className="text-xs text-muted-foreground mt-1">Tested at: {lastLiveDataResult.timestamp.toLocaleTimeString()}</div>}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Testing Guide:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Ensure you are authenticated with GP51 via the 'Authentication' tab.</li>
            <li>First, use the 'API Connection Test' to verify credentials and basic API reachability.</li>
            <li>If successful, use 'Fetch Live Data' to test pulling actual data from GP51.</li>
            <li>Both tests should pass for complete GP51 functionality.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51ConnectionTester;

