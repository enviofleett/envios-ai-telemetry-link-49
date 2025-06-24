
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: any;
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
      console.log('🔍 Running GP51 diagnostics...');

      // Test GP51 connection using the get_import_preview action
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'get_import_preview' }
      });

      const connectionResult: DiagnosticResult = {
        test: 'GP51 Connection',
        status: 'pass',
        message: 'GP51 connection is healthy',
        details: data
      };

      if (error) {
        connectionResult.status = 'fail';
        connectionResult.message = `Connection failed: ${error.message}`;
      } else if (!data?.success) {
        connectionResult.status = 'warning';
        connectionResult.message = data?.error || 'Connection established but with warnings';
      }

      const newResults = [connectionResult];

      // Test authentication status
      const authResult: DiagnosticResult = {
        test: 'Authentication Status',
        status: data?.connectionStatus?.connected ? 'pass' : 'fail',
        message: data?.connectionStatus?.connected 
          ? `Authenticated as ${data.connectionStatus.username || 'unknown user'}` 
          : data?.connectionStatus?.error || 'Not authenticated'
      };

      newResults.push(authResult);

      // Test data availability
      const dataResult: DiagnosticResult = {
        test: 'Data Availability',
        status: 'pass',
        message: `${data?.data?.summary?.users || 0} users and ${data?.data?.summary?.vehicles || 0} vehicles available`
      };

      if ((data?.data?.summary?.users || 0) === 0 && (data?.data?.summary?.vehicles || 0) === 0) {
        dataResult.status = 'warning';
        dataResult.message = 'No data available for import';
      }

      newResults.push(dataResult);

      setResults(newResults);
      setLastRun(new Date());

      const overallStatus = newResults.some(r => r.status === 'fail') ? 'fail' : 
                           newResults.some(r => r.status === 'warning') ? 'warning' : 'pass';

      toast({
        title: "Diagnostics Complete",
        description: `GP51 diagnostics completed with ${overallStatus} status`,
        variant: overallStatus === 'fail' ? 'destructive' : 'default'
      });

    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      
      const errorResult: DiagnosticResult = {
        test: 'GP51 Connection',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };

      setResults([errorResult]);
      setLastRun(new Date());

      toast({
        title: "Diagnostics Failed",
        description: "Unable to complete GP51 diagnostics",
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
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Diagnostics</CardTitle>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              'Run Diagnostics'
            )}
          </Button>
        </div>
        <CardDescription>
          Test GP51 connectivity, authentication, and data availability.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lastRun && (
          <div className="text-sm text-gray-500 mb-4">
            Last run: {lastRun.toLocaleString()}
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <div className="font-medium">{result.test}</div>
                    <div className="text-sm text-gray-600">{result.message}</div>
                  </div>
                </div>
                <Badge className={getStatusColor(result.status)}>
                  {result.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        ) : !isRunning ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No diagnostics have been run yet</div>
            <p className="text-sm text-gray-400">
              Click "Run Diagnostics" to test your GP51 integration
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-gray-500">Running diagnostics...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51DiagnosticsPanel;
