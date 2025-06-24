
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Code, Play, Copy } from 'lucide-react';

interface DebugResult {
  success: boolean;
  data?: any;
  error?: string;
  requestUrl?: string;
  responseTime?: number;
  curlCommand?: string;
}

const GP51DebugPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const { toast } = useToast();

  const testQueryDevicesTree = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      console.log('🧪 Testing querydevicestree API...');

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'get_import_preview' }
      });

      if (error) {
        throw new Error(error.message);
      }

      const debugResult: DebugResult = {
        success: data.success || false,
        data: data.data,
        error: data.error,
        requestUrl: 'https://api.gps51.com/webapi?action=querydevicestree&token=[MASKED]&extend=self&serverid=0',
        responseTime: data.processingTime,
        curlCommand: generateCurlCommand()
      };

      setResult(debugResult);

      if (debugResult.success) {
        toast({
          title: "Debug Test Successful",
          description: `Found ${debugResult.data?.summary?.vehicles || 0} vehicles and ${debugResult.data?.summary?.users || 0} users`
        });
      } else {
        toast({
          title: "Debug Test Failed",
          description: debugResult.error || "Unknown error",
          variant: "destructive"
        });
      }

    } catch (error) {
      const errorResult: DebugResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        curlCommand: generateCurlCommand()
      };

      setResult(errorResult);

      toast({
        title: "Debug Test Failed",
        description: errorResult.error,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const generateCurlCommand = (): string => {
    return `curl -X POST "https://api.gps51.com/webapi?action=querydevicestree&token=YOUR_TOKEN&extend=self&serverid=0" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json"`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The curl command has been copied to your clipboard"
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-purple-600" />
            <CardTitle>GP51 API Debug Panel</CardTitle>
          </div>
          <Button onClick={testQueryDevicesTree} disabled={isRunning} size="sm">
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? 'Testing...' : 'Test querydevicestree'}
          </Button>
        </div>
        <CardDescription>
          Test the querydevicestree API call with proper parameters and debug any issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-4">
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <strong>Status:</strong> {result.success ? 'Success' : 'Failed'}
                {result.responseTime && <span> ({result.responseTime}ms)</span>}
              </AlertDescription>
            </Alert>

            {result.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                <p className="text-sm text-red-700">{result.error}</p>
              </div>
            )}

            {result.success && result.data && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <h4 className="font-medium text-green-800 mb-2">Success Details:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Vehicles:</strong> {result.data.summary?.vehicles || 0}</p>
                  <p><strong>Users:</strong> {result.data.summary?.users || 0}</p>
                  <p><strong>Groups:</strong> {result.data.summary?.groups || 0}</p>
                  <p><strong>Connected:</strong> {result.data.authentication?.connected ? 'Yes' : 'No'}</p>
                  {result.data.authentication?.username && (
                    <p><strong>Username:</strong> {result.data.authentication.username}</p>
                  )}
                </div>
              </div>
            )}

            {result.requestUrl && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium text-blue-800 mb-2">API Request URL:</h4>
                <p className="text-sm text-blue-700 font-mono break-all">{result.requestUrl}</p>
              </div>
            )}

            {result.curlCommand && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">Manual curl command:</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(result.curlCommand!)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {result.curlCommand}
                </pre>
                <p className="text-xs text-gray-600 mt-2">
                  Replace YOUR_TOKEN with a valid GP51 token to test manually
                </p>
              </div>
            )}
          </div>
        )}

        {!result && !isRunning && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No debug tests have been run yet</div>
            <p className="text-sm text-gray-400">
              Click "Test querydevicestree" to debug the GP51 API call
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51DebugPanel;
