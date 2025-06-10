
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGP51Diagnostics } from '@/hooks/useGP51Diagnostics';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Zap, Activity } from 'lucide-react';

const GP51DiagnosticsPanel: React.FC = () => {
  const { 
    isRunning, 
    results, 
    lastRun, 
    runDiagnostics, 
    runFullSync, 
    getSyncStatus 
  } = useGP51Diagnostics();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pass': return 'default';
      case 'warning': return 'secondary';
      case 'fail': return 'destructive';
      default: return 'outline';
    }
  };

  const syncStatus = getSyncStatus();
  const hasActiveLocks = syncStatus.activeLocks && syncStatus.activeLocks.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            GP51 System Diagnostics
          </CardTitle>
          <CardDescription>
            Comprehensive health check for GP51 integration and data flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
            </Button>
            <Button 
              onClick={runFullSync} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Force Full Sync
            </Button>
          </div>

          {/* Sync Status Alert */}
          {hasActiveLocks && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Active sync operations detected: {syncStatus.activeLocks.map((lock: any) => lock.key).join(', ')}
                <br />
                <span className="text-sm text-muted-foreground">
                  These operations are currently running or may be stuck. Consider waiting or checking logs.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Last Run Info */}
          {lastRun && (
            <div className="text-sm text-muted-foreground">
              Last diagnostic run: {lastRun.toLocaleString()}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Test Results</h4>
              {results.map((result, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.test}</span>
                      <Badge variant={getStatusBadgeVariant(result.status) as any}>
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {result.message}
                  </div>
                  {result.details && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Help Text */}
          {results.length === 0 && !isRunning && (
            <Alert>
              <AlertDescription>
                Click "Run Diagnostics" to perform a comprehensive health check of your GP51 integration.
                This will test session validity, data integrity, sync activity, and API connectivity.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51DiagnosticsPanel;
