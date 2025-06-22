
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TestTube, CheckCircle, AlertCircle, Network, Clock, Database, Shield } from 'lucide-react';

interface DiagnosticResult {
  success: boolean;
  error?: string;
  authMethod?: string;
  tokenValid?: boolean;
  diagnostics?: any;
  warning?: string;
  sessionInfo?: any;
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
    setIsLoading(true);
    setStartTime(Date.now());
    setLastResult(null);

    try {
      console.log('🧪 Running enhanced GP51 diagnostics...');

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: {
          action: 'test_connection',
          username: credentials.username.trim() || undefined,
          password: credentials.password || undefined
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
          description: data.message || `Authentication successful using ${data.authMethod} method`,
        });
      } else {
        toast({
          title: "GP51 Connection Issue",
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

  const getStatusIcon = () => {
    if (!lastResult) return <TestTube className="h-5 w-5" />;
    if (lastResult.success) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  const getAuthMethodIcon = (method?: string) => {
    switch (method) {
      case 'existing_session':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'new_authentication':
        return <Shield className="h-4 w-4 text-green-600" />;
      default:
        return <Network className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Enhanced GP51 Connection Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Network className="h-4 w-4" />
          <AlertDescription>
            Enhanced diagnostics using existing sessions and proven authentication patterns. 
            Leave credentials empty to test existing sessions only.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-username">GP51 Username (Optional)</Label>
            <Input
              id="test-username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Leave empty to use existing session"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-password">GP51 Password (Optional)</Label>
            <Input
              id="test-password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Leave empty to use existing session"
            />
          </div>
        </div>

        <Button 
          onClick={runDiagnostics} 
          disabled={isLoading}
          className="w-full"
        >
          <TestTube className="h-4 w-4 mr-2" />
          {isLoading ? 'Running Enhanced Diagnostics...' : 'Run Enhanced GP51 Diagnostics'}
        </Button>

        {isLoading && startTime && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Testing GP51 connection with enhanced diagnostics... ({Math.round((Date.now() - startTime) / 1000)}s)
            </AlertDescription>
          </Alert>
        )}

        {lastResult && (
          <Alert className={lastResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2 mb-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="font-medium">
                {lastResult.success ? 'Connection Successful' : 'Connection Failed'}
              </span>
            </div>
            <AlertDescription>
              <div className="space-y-3">
                <div className={lastResult.success ? "text-green-800" : "text-red-800"}>
                  <strong>Result:</strong> {lastResult.success ? lastResult.message : lastResult.error}
                </div>
                
                {lastResult.authMethod && (
                  <div className="flex items-center gap-2 text-blue-800">
                    {getAuthMethodIcon(lastResult.authMethod)}
                    <span><strong>Method:</strong> {lastResult.authMethod.replace('_', ' ').toUpperCase()}</span>
                  </div>
                )}

                {lastResult.sessionInfo && (
                  <div className="text-blue-800">
                    <strong>Session:</strong> {lastResult.sessionInfo.username} (ID: {lastResult.sessionInfo.sessionId?.substring(0, 8)}...)
                  </div>
                )}
                
                {lastResult.warning && (
                  <div className="text-amber-700">
                    <strong>Warning:</strong> {lastResult.warning}
                  </div>
                )}

                {lastResult.diagnostics && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Technical Details ({lastResult.diagnostics.elapsed || 0}ms)
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
          <p>• Enhanced diagnostics with session management and proven authentication</p>
          <p>• Automatically uses existing valid sessions when available</p>
          <p>• Falls back to new authentication only when credentials provided</p>
          <p>• Uses form-data POST pattern proven to work with GP51</p>
          <p>• Provides detailed technical diagnostics for troubleshooting</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51DiagnosticsPanel;
