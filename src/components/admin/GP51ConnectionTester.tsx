
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Trash2,
  AlertTriangle,
  Wifi
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import type { GP51ConnectionTestResult, GP51ConnectionTesterProps } from '@/types/gp51-unified';

export const GP51ConnectionTester: React.FC<GP51ConnectionTesterProps> = ({ 
  onStatusChange 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<GP51ConnectionTestResult | null>(null);
  const { toast } = useToast();
  const { testConnection, disconnect } = useUnifiedGP51Service();

  const handleTestConnection = async () => {
    setIsLoading(true);
    
    try {
      console.log('🧪 Starting GP51 connection test...');
      
      const result = await testConnection();
      
      // Convert the testConnection result to GP51ConnectionTestResult
      const connectionTestResult: GP51ConnectionTestResult = {
        success: result.success,
        message: result.message,
        error: result.success ? undefined : result.message,
        data: result.success ? { message: 'Connection successful' } : undefined
      };

      setTestResult(connectionTestResult);

      // Call onStatusChange if provided
      if (onStatusChange) {
        onStatusChange(connectionTestResult);
      }

      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });

    } catch (error) {
      console.error('❌ Connection test exception:', error);
      const errorResult: GP51ConnectionTestResult = {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
      
      setTestResult(errorResult);

      if (onStatusChange) {
        onStatusChange(errorResult);
      }

      toast({
        title: "Test Failed",
        description: "Connection test encountered an error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSessions = async () => {
    setIsLoading(true);
    
    try {
      await disconnect();
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

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
    if (testResult?.success) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (testResult && !testResult.success) return <XCircle className="h-5 w-5 text-red-600" />;
    return <Wifi className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Testing Connection...';
    if (testResult?.success) return 'Connected';
    if (testResult && !testResult.success) return 'Connection Failed';
    return 'Not Tested';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          GP51 Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{getStatusText()}</p>
              {testResult && (
                <p className="text-sm text-muted-foreground">
                  Last tested: {new Date().toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          
          <Badge variant={testResult?.success ? "default" : "secondary"}>
            {testResult?.success ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Status:</strong> {testResult.message}</p>
                {testResult.error && (
                  <p><strong>Error:</strong> {testResult.error}</p>
                )}
                {testResult.data && (
                  <div className="text-sm">
                    <p><strong>Details:</strong></p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleTestConnection}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>

          <Button
            onClick={clearSessions}
            disabled={isLoading}
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Clear Sessions
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Test Connection: Verifies GP51 API connectivity</p>
          <p>• Clear Sessions: Removes all stored GP51 sessions (requires re-authentication)</p>
          <p>• Use "Clear Sessions" if you're experiencing persistent authentication issues</p>
        </div>
      </CardContent>
    </Card>
  );
};
