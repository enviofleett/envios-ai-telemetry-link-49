
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
import { GP51SessionManager } from '@/services/gp51/sessionManager';
import { supabase } from '@/integrations/supabase/client';

export const GP51ConnectionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingSession, setIsClearingSession] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
    timestamp: Date;
  } | null>(null);
  const { toast } = useToast();

  const clearSessions = async () => {
    setIsClearingSession(true);
    try {
      await GP51SessionManager.clearAllSessions();
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
      setIsClearingSession(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      console.log('🧪 Starting GP51 connection test...');
      
      // First validate existing session
      const sessionValidation = await GP51SessionManager.validateSession();
      console.log('Session validation result:', sessionValidation);
      
      if (!sessionValidation.valid) {
        setTestResult({
          success: false,
          message: sessionValidation.error || 'No valid session found',
          details: { sessionCheck: 'failed', reason: sessionValidation.error },
          timestamp: new Date()
        });
        return;
      }

      // Test GP51 API connectivity via edge function
      console.log('🌐 Testing GP51 API connectivity...');
      const { data, error } = await supabase.functions.invoke('gp51-connection-check', {
        body: { testConnectivity: true }
      });

      const latency = Date.now() - startTime;

      if (error) {
        console.error('❌ Connection test failed:', error);
        setTestResult({
          success: false,
          message: `Connection test failed: ${error.message}`,
          details: { error: error.message, latency },
          timestamp: new Date()
        });
        return;
      }

      console.log('✅ Connection test result:', data);
      setTestResult({
        success: data.success || false,
        message: data.success ? 'GP51 connection healthy' : (data.error || 'Connection test failed'),
        details: { ...data, latency },
        timestamp: new Date()
      });

      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.success ? 
          `GP51 API is responding in ${latency}ms` : 
          (data.error || 'Unknown error occurred'),
        variant: data.success ? "default" : "destructive"
      });

    } catch (error) {
      console.error('❌ Connection test exception:', error);
      const latency = Date.now() - startTime;
      
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { exception: true, latency },
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
                {testResult.details?.latency && (
                  <p><strong>Response Time:</strong> {testResult.details.latency}ms</p>
                )}
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
            disabled={isClearingSession}
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className={`h-4 w-4 mr-2 ${isClearingSession ? 'animate-spin' : ''}`} />
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
