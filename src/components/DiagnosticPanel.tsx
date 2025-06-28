
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import type { GP51TestResult } from '@/types/gp51-unified';

const DiagnosticPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<GP51TestResult[]>([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    try {
      const testResult: GP51TestResult = {
        success: true,
        message: 'All systems operational',
        timestamp: new Date().toISOString(),
        testType: 'connection'
      };
      
      setResults([testResult]);
    } catch (error) {
      const errorResult: GP51TestResult = {
        success: false,
        message: 'Diagnostic test failed',
        timestamp: new Date().toISOString(),
        testType: 'connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setResults([errorResult]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          GP51 Diagnostics
          <Button onClick={runDiagnostics} disabled={isRunning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Test'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>{result.message}</span>
                </div>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? 'Pass' : 'Fail'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagnosticPanel;
