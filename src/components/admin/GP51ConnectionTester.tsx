
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity as ActivityIconLucide, Zap, Database, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';

const GP51ConnectionTester: React.FC = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingData, setIsTestingData] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [dataResult, setDataResult] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const { toast } = useToast();

  // Load session info on mount
  React.useEffect(() => {
    const unsubscribe = unifiedGP51Service.subscribeToSession((session) => {
      setSessionInfo(session);
    });

    return unsubscribe;
  }, []);

  const testApiConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      console.log('🧪 Testing GP51 API connection...');
      const result = await unifiedGP51Service.testConnection();
      
      setConnectionResult(result);
      
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: `GP51 API is responding correctly. Found ${result.data?.deviceCount || 0} devices.`,
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: result.error || "GP51 API is not responding",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection test failed';
      setConnectionResult({ success: false, error: errorMsg });
      toast({
        title: "Connection Test Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testDataFetch = async () => {
    setIsTestingData(true);
    setDataResult(null);

    try {
      console.log('📋 Testing GP51 data fetch with queryMonitorList...');
      
      // This is the method that was missing and causing the original error
      const result = await unifiedGP51Service.queryMonitorList();
      
      setDataResult(result);
      
      if (result.success) {
        const deviceCount = Array.isArray(result.data) ? result.data.length : 0;
        toast({
          title: "Data Fetch Successful",
          description: `Successfully retrieved ${deviceCount} devices from GP51.`,
        });
      } else {
        toast({
          title: "Data Fetch Failed",
          description: result.error || "Failed to retrieve device data",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Data fetch failed';
      setDataResult({ success: false, error: errorMsg });
      toast({
        title: "Data Fetch Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsTestingData(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log('🔄 Refreshing GP51 session...');
      const result = await unifiedGP51Service.refreshSession();
      
      if (result.success) {
        toast({
          title: "Session Refreshed",
          description: "GP51 session has been refreshed successfully",
        });
      } else {
        toast({
          title: "Session Refresh Failed",
          description: result.error || "Failed to refresh session",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Session Refresh Error",
        description: error instanceof Error ? error.message : "Session refresh failed",
        variant: "destructive",
      });
    }
  };

  const getSessionStatusBadge = () => {
    if (!sessionInfo) {
      return <Badge variant="destructive">No Session</Badge>;
    }

    if (!sessionInfo.isValid) {
      return <Badge variant="destructive">Invalid Session</Badge>;
    }

    const isExpiringSoon = new Date(sessionInfo.expiresAt).getTime() - Date.now() < 2 * 60 * 60 * 1000; // 2 hours
    
    if (isExpiringSoon) {
      return <Badge variant="outline">Expires Soon</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const getTestStatusIcon = (result: any, isLoading: boolean) => {
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (!result) {
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
    
    return result.success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIconLucide className="h-5 w-5" />
          GP51 Connection Testing
        </CardTitle>
        <CardDescription>
          Test your GP51 integration and verify live data connectivity using the unified service.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h4 className="font-medium">Session Status</h4>
            <p className="text-sm text-muted-foreground">
              {sessionInfo ? `User: ${sessionInfo.username}` : 'No active session'}
            </p>
            {sessionInfo && (
              <p className="text-xs text-muted-foreground">
                Expires: {new Date(sessionInfo.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getSessionStatusBadge()}
            <Button variant="outline" size="sm" onClick={refreshSession}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* API Connection Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">API Connection Test</h4>
              {getTestStatusIcon(connectionResult, isTestingConnection)}
            </div>
            <Button
              onClick={testApiConnection}
              disabled={!sessionInfo?.isValid || isTestingConnection}
              variant="outline"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-1" />
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
          
          {connectionResult && (
            <div className={`p-3 rounded-md text-sm ${
              connectionResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {connectionResult.success ? (
                <div>
                  <p className="font-medium">✅ Connection Successful</p>
                  <p>Found {connectionResult.data?.deviceCount || 0} devices</p>
                  <p>Response time: {connectionResult.data?.latency || 'N/A'}ms</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">❌ Connection Failed</p>
                  <p>{connectionResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Fetch Test - This fixes the original queryMonitorList error */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Device Data Fetch Test</h4>
              {getTestStatusIcon(dataResult, isTestingData)}
            </div>
            <Button
              onClick={testDataFetch}
              disabled={!sessionInfo?.isValid || isTestingData || !connectionResult?.success}
              variant="outline"
              size="sm"
            >
              <Database className="h-4 w-4 mr-1" />
              {isTestingData ? 'Fetching...' : 'Fetch Device Data'}
            </Button>
          </div>
          
          {dataResult && (
            <div className={`p-3 rounded-md text-sm ${
              dataResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {dataResult.success ? (
                <div>
                  <p className="font-medium">✅ Data Fetch Successful</p>
                  <p>Retrieved {Array.isArray(dataResult.data) ? dataResult.data.length : 0} devices</p>
                  <p>Monitor list query completed successfully</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">❌ Data Fetch Failed</p>
                  <p>{dataResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Testing Guide */}
        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Testing Guide:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Ensure you have an active GP51 session via the Settings tab</li>
            <li>First, test the API connection to verify credentials and connectivity</li>
            <li>If successful, test device data fetch to verify the queryMonitorList functionality</li>
            <li>Both tests should pass for complete GP51 functionality</li>
            <li>Use the Refresh button if your session expires</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51ConnectionTester;
