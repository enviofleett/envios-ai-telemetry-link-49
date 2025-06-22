
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
  XCircle, 
  AlertCircle, 
  Clock,
  User,
  Database,
  Wifi,
  Info
} from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'warning' | 'fail';
  details: string;
  error?: string;
  responseTime?: number;
  sessionInfo?: {
    username?: string;
    expiresAt?: string;
    minutesUntilExpiry?: number;
    deviceCount?: number;
    apiUrl?: string;
    sessionCount?: number;
  };
}

const GP51DiagnosticsPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      console.log('🔧 Starting GP51 diagnostics...');

      // Test GP51 connection using enhanced bulk import
      const { data: connectionResult, error: connectionError } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'test_connection' }
      });

      if (connectionError) {
        console.error('❌ Connection test error:', connectionError);
        setResults([{
          test: 'GP51 Connection',
          status: 'fail',
          details: `Connection test failed: ${connectionError.message}`,
          error: connectionError.message
        }]);
        return;
      }

      console.log('📊 Connection test result:', connectionResult);

      const diagnostics: DiagnosticResult[] = [];

      // Parse connection result
      if (connectionResult?.success) {
        diagnostics.push({
          test: 'GP51 API Connection',
          status: 'pass',
          details: connectionResult.message || 'GP51 API connection successful',
          responseTime: connectionResult.details?.responseTime,
          sessionInfo: {
            username: connectionResult.details?.username,
            expiresAt: connectionResult.details?.expiresAt,
            minutesUntilExpiry: connectionResult.details?.minutesUntilExpiry,
            deviceCount: connectionResult.details?.deviceCount,
            apiUrl: connectionResult.details?.apiUrl,
            sessionCount: connectionResult.sessionCount
          }
        });

        // Session validation test
        if (connectionResult.details?.username) {
          const expiryMinutes = connectionResult.details.minutesUntilExpiry || 0;
          diagnostics.push({
            test: 'Session Validation',
            status: expiryMinutes > 60 ? 'pass' : expiryMinutes > 10 ? 'warning' : 'fail',
            details: `Session for ${connectionResult.details.username} expires in ${expiryMinutes} minutes`,
            sessionInfo: {
              username: connectionResult.details.username,
              expiresAt: connectionResult.details.expiresAt,
              minutesUntilExpiry: expiryMinutes
            }
          });
        }

        // Device count test
        if (connectionResult.details?.deviceCount !== undefined) {
          diagnostics.push({
            test: 'Device Discovery',
            status: connectionResult.details.deviceCount > 0 ? 'pass' : 'warning',
            details: `Found ${connectionResult.details.deviceCount} devices in GP51`,
            sessionInfo: {
              deviceCount: connectionResult.details.deviceCount
            }
          });
        }

        // API response time test
        if (connectionResult.details?.responseTime) {
          const responseTime = connectionResult.details.responseTime;
          diagnostics.push({
            test: 'API Response Time',
            status: responseTime < 3000 ? 'pass' : responseTime < 10000 ? 'warning' : 'fail',
            details: `GP51 API responded in ${responseTime}ms`,
            responseTime
          });
        }

      } else {
        // Connection failed
        const errorMessage = connectionResult?.message || 'Unknown connection error';
        const sessionCount = connectionResult?.sessionCount || 0;
        
        diagnostics.push({
          test: 'GP51 API Connection',
          status: 'fail',
          details: errorMessage,
          error: connectionResult?.details?.connectionError || errorMessage,
          sessionInfo: {
            sessionCount
          }
        });

        // Add session status info if available
        if (sessionCount > 0) {
          diagnostics.push({
            test: 'Session Status',
            status: 'warning',
            details: `Found ${sessionCount} sessions in database but none are currently valid`,
            sessionInfo: {
              sessionCount
            }
          });
        } else {
          diagnostics.push({
            test: 'Session Status',
            status: 'fail',
            details: 'No GP51 sessions found in database',
            sessionInfo: {
              sessionCount: 0
            }
          });
        }
      }

      setResults(diagnostics);
      setLastRun(new Date());

      // Show toast with summary
      const passCount = diagnostics.filter(r => r.status === 'pass').length;
      const totalCount = diagnostics.length;
      
      toast({
        title: "Diagnostics Complete",
        description: `${passCount}/${totalCount} tests passed`,
        variant: passCount === totalCount ? "default" : "destructive"
      });

    } catch (error) {
      console.error('❌ Diagnostics error:', error);
      setResults([{
        test: 'Diagnostics System',
        status: 'fail',
        details: `Diagnostics failed to run: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);

      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      pass: 'default',
      warning: 'secondary',
      fail: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatSessionInfo = (result: DiagnosticResult) => {
    if (!result.sessionInfo) return null;

    return (
      <div className="mt-2 text-xs text-muted-foreground space-y-1">
        {result.sessionInfo.username && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>User: {result.sessionInfo.username}</span>
          </div>
        )}
        {result.sessionInfo.expiresAt && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Expires: {new Date(result.sessionInfo.expiresAt).toLocaleString()}</span>
          </div>
        )}
        {result.sessionInfo.deviceCount !== undefined && (
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span>Devices: {result.sessionInfo.deviceCount}</span>
          </div>
        )}
        {result.responseTime && (
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            <span>Response: {result.responseTime}ms</span>
          </div>
        )}
        {result.sessionInfo.apiUrl && (
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>API: {result.sessionInfo.apiUrl}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          GP51 Diagnostics Panel
        </CardTitle>
        <CardDescription>
          Comprehensive testing and validation of GP51 integration using established authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Activity className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
          
          {lastRun && (
            <span className="text-sm text-muted-foreground">
              Last run: {lastRun.toLocaleTimeString()}
            </span>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Diagnostic Results</h4>
            
            {results.map((result, index) => (
              <Alert key={index} className={`
                ${result.status === 'pass' ? 'border-green-200 bg-green-50' : 
                  result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                  'border-red-200 bg-red-50'}
              `}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium">{result.test}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <AlertDescription className="mt-1">
                        {result.details}
                      </AlertDescription>
                      {result.error && (
                        <div className="mt-1 text-xs text-red-600 font-mono">
                          Error: {result.error}
                        </div>
                      )}
                      {formatSessionInfo(result)}
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
            
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h5 className="font-medium text-sm mb-2">Summary</h5>
              <div className="text-sm text-muted-foreground">
                <div>✅ Passed: {results.filter(r => r.status === 'pass').length}</div>
                <div>⚠️ Warnings: {results.filter(r => r.status === 'warning').length}</div>
                <div>❌ Failed: {results.filter(r => r.status === 'fail').length}</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
          <strong>Diagnostic Tests Include:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>GP51 API connection using existing authentication</li>
            <li>Session validation and expiry checking</li>
            <li>Device discovery and count verification</li>
            <li>API response time measurement</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51DiagnosticsPanel;
