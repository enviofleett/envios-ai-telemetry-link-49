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
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { unifiedGP51Service } from '@/services/gp51/unifiedGP51Service';

export const GP51ConnectionTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
    timestamp: Date;
  } | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.testConnection();
      
      setTestResult({
        success: result.success,
        message: result.success ? 'GP51 connection is working properly' : (result.error || 'Connection test failed'),
        details: result.data,
        timestamp: new Date()
      });

      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.success ? 
          "GP51 connection is working properly" : 
          (result.error || 'Unknown error occurred'),
        variant: result.success ? "default" : "destructive"
      });

    } catch (error) {
      console.error('❌ Connection test exception:', error);
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { exception: true },
        timestamp: new Date()
      });

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
      await unifiedGP51Service.disconnect();
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
                  Last tested: {testResult.timestamp.toLocaleTimeString()}
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
                {testResult.details?.error && (
                  <p><strong>Error:</strong> {testResult.details.error}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={testConnection}
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
