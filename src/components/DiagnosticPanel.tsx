
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useGP51Connection } from '@/hooks/useGP51Connection';
import type { GP51TestResult } from '@/types/gp51-unified';

// Helper function to create properly structured test results
const createTestResult = (name: string, success: boolean, data?: any, error?: string): GP51TestResult => ({
  name,
  success,
  testType: success ? 'connection' : 'connection',
  message: success ? `${name} completed successfully` : `${name} failed`,
  duration: Date.now(),
  responseTime: Date.now(),
  timestamp: new Date(),
  data,
  error
});

const GP51DiagnosticsPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<GP51TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { checkConnection, fetchLiveData } = useGP51Connection();

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    const results: GP51TestResult[] = [];

    try {
      // Test connection
      const connectionResult = createTestResult('Connection Test', false);
      try {
        await checkConnection();
        results.push({ ...connectionResult, success: true, message: 'Connection test passed' });
      } catch (error) {
        results.push({ 
          ...connectionResult, 
          success: false, 
          error: error instanceof Error ? error.message : 'Connection failed',
          message: 'Connection test failed'
        });
      }

      // Test live data fetch
      const dataResult = createTestResult('Live Data Test', false);
      try {
        await fetchLiveData();
        results.push({ ...dataResult, success: true, message: 'Live data test passed' });
      } catch (error) {
        results.push({ 
          ...dataResult, 
          success: false, 
          error: error instanceof Error ? error.message : 'Data fetch failed',
          message: 'Live data test failed'
        });
      }

      setDiagnostics(results);
      
      const passedTests = results.filter(r => r.success).length;
      toast.success(`Diagnostics complete: ${passedTests}/${results.length} tests passed`);
      
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast.error('Failed to run diagnostics');
    } finally {
      setIsRunning(false);
    }
  }, [checkConnection, fetchLiveData]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>GP51 Diagnostics</CardTitle>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {diagnostics.length === 0 ? (
          <p className="text-muted-foreground">Click "Run Diagnostics" to test GP51 connectivity</p>
        ) : (
          <div className="space-y-3">
            {diagnostics.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">{result.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {result.responseTime}ms
                  </span>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51DiagnosticsPanel;
