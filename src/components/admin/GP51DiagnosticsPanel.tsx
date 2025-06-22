
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TestTube, CheckCircle, AlertCircle, Network, Clock } from 'lucide-react';

interface DiagnosticResult {
  success: boolean;
  error?: string;
  authMethod?: string;
  tokenValid?: boolean;
  diagnostics?: any;
  warning?: string;
}

const GP51DiagnosticsPanel: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<DiagnosticResult | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    if (!credentials.username.trim() || !credentials.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setStartTime(Date.now());
    setLastResult(null);

    try {
      console.log('🧪 Running GP51 diagnostics...');

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: {
          action: 'test_connection',
          username: credentials.username.trim(),
          password: credentials.password
        }
      });

      const elapsed = startTime ? Date.now() - startTime : 0;

      if (error) {
        console.error('❌ Diagnostics error:', error);
        setLastResult({
          success: false,
          error: error.message || 'Diagnostics failed',
          diagnostics: { elapsed, error: error.message }
        });
        toast({
          title: "Diagnostics Failed",
          description: error.message || 'Failed to run GP51 diagnostics',
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Diagnostics completed:', data);
      setLastResult({
        ...data,
        diagnostics: { ...data.diagnostics, elapsed }
      });

      if (data.success) {
        toast({
          title: "GP51 Connection Verified",
          description: `Authentication successful using ${data.authMethod} method`,
        });
      } else {
        toast({
          title: "GP51 Connection Failed",
          description: data.error || 'Connection test failed',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Diagnostics exception:', error);
      const elapsed = startTime ? Date.now() - startTime : 0;
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics: { elapsed }
      });
      toast({
        title: "Diagnostics Error",
        description: "Failed to run GP51 diagnostics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setStartTime(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          GP51 Connection Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Network className="h-4 w-4" />
          <AlertDescription>
            This tool tests GP51 connectivity using multiple authentication strategies and provides detailed diagnostics.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-username">GP51 Username</Label>
            <Input
              id="test-username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter GP51 username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-password">GP51 Password</Label>
            <Input
              id="test-password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter GP51 password"
            />
          </div>
        </div>

        <Button 
          onClick={runDiagnostics} 
          disabled={isLoading || !credentials.username.trim() || !credentials.password.trim()}
          className="w-full"
        >
          <TestTube className="h-4 w-4 mr-2" />
          {isLoading ? 'Running Diagnostics...' : 'Run GP51 Diagnostics'}
        </Button>

        {isLoading && startTime && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Testing GP51 connection... ({Math.round((Date.now() - startTime) / 1000)}s)
            </AlertDescription>
          </Alert>
        )}

        {lastResult && (
          <Alert className={lastResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {lastResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <div className={lastResult.success ? "text-green-800" : "text-red-800"}>
                  <strong>{lastResult.success ? 'Success:' : 'Failed:'}</strong> {
                    lastResult.success 
                      ? `GP51 connection verified using ${lastResult.authMethod} method`
                      : lastResult.error
                  }
                </div>
                
                {lastResult.warning && (
                  <div className="text-amber-700">
                    <strong>Warning:</strong> {lastResult.warning}
                  </div>
                )}

                {lastResult.diagnostics && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Diagnostic Details ({lastResult.diagnostics.elapsed}ms)
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(lastResult.diagnostics, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Tests multiple authentication methods (GET, POST form, POST JSON)</p>
          <p>• Validates token functionality with GP51 API</p>
          <p>• Provides detailed error information for troubleshooting</p>
          <p>• Measures response times and connection quality</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51DiagnosticsPanel;
