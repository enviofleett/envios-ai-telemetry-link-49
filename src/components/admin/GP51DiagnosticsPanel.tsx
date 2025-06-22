
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Database,
  Settings,
  Zap
} from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'warning' | 'fail';
  details?: string;
  sessionInfo?: any;
  error?: string;
}

interface SessionInfo {
  username?: string;
  expiresAt?: string;
  isValid?: boolean;
  tokenLength?: number;
}

const GP51DiagnosticsPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      console.log('🧪 Running enhanced GP51 diagnostics...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'test_connection' }
      });

      console.log('✅ Diagnostics completed:', data);

      if (error) {
        setResults([{
          test: 'GP51 Connection Test',
          status: 'fail',
          details: `Edge Function Error: ${error.message}`,
          error: error.message
        }]);
        
        toast({
          title: "Diagnostics Failed",
          description: "Edge Function error occurred",
          variant: "destructive"
        });
        return;
      }

      // Parse the response and create diagnostic results
      const diagnosticResults: DiagnosticResult[] = [];

      if (data.success) {
        diagnosticResults.push({
          test: 'GP51 API Connection',
          status: 'pass',
          details: `Successfully connected to GP51 API`
        });

        if (data.sessionInfo) {
          setSessionInfo(data.sessionInfo);
          diagnosticResults.push({
            test: 'GP51 Session Status',
            status: 'pass',
            details: `Active session for ${data.sessionInfo.username}`,
            sessionInfo: data.sessionInfo
          });
        }

        if (data.diagnostics?.deviceCount !== undefined) {
          diagnosticResults.push({
            test: 'GP51 Data Access',
            status: 'pass',
            details: `Found ${data.diagnostics.deviceCount} devices`
          });
        }
      } else {
        diagnosticResults.push({
          test: 'GP51 Connection Test',
          status: 'fail',
          details: data.error || 'Connection test failed',
          error: data.error
        });

        if (data.errorType === 'authentication_failed') {
          diagnosticResults.push({
            test: 'GP51 Authentication',
            status: 'fail',
            details: 'Authentication failed - check credentials',
            error: data.error
          });
        }

        if (data.errorType === 'validation_error') {
          diagnosticResults.push({
            test: 'Request Validation',
            status: 'fail',
            details: 'Invalid request parameters',
            error: data.error
          });
        }
      }

      setResults(diagnosticResults);
      setLastRun(new Date());

      toast({
        title: "Diagnostics Completed",
        description: `Ran ${diagnosticResults.length} tests`,
      });

    } catch (error) {
      console.error('❌ Diagnostics error:', error);
      
      setResults([{
        test: 'GP51 Diagnostics',
        status: 'fail',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);

      toast({
        title: "Diagnostics Error",
        description: "Failed to run diagnostics",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          GP51 Diagnostics Panel
        </CardTitle>
        <CardDescription>
          Test GP51 connection, authentication, and data access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Panel */}
        <div className="flex items-center justify-between">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isRunning ? 'Running Tests...' : 'Run Diagnostics'}
          </Button>
          
          {lastRun && (
            <div className="text-sm text-gray-500">
              Last run: {lastRun.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Session Information */}
        {sessionInfo && (
          <Alert className="border-blue-200 bg-blue-50">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium text-blue-800">Active GP51 Session</div>
                <div className="text-sm text-blue-700">
                  User: {sessionInfo.username} | 
                  Valid: {sessionInfo.isValid ? 'Yes' : 'No'} | 
                  Token Length: {sessionInfo.tokenLength}
                </div>
                {sessionInfo.expiresAt && (
                  <div className="text-xs text-blue-600">
                    Expires: {new Date(sessionInfo.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostic Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Test Results</h4>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-gray-600">{result.details}</div>
                      {result.error && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Diagnostics Information:</div>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Tests GP51 API connectivity and authentication</li>
                <li>Checks for valid existing sessions</li>
                <li>Validates data access permissions</li>
                <li>Provides detailed error information for troubleshooting</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GP51DiagnosticsPanel;
