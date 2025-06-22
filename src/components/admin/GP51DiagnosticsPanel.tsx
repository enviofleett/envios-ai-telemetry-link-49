
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Key, 
  Wifi,
  RefreshCw,
  Database,
  Timer
} from 'lucide-react';

interface SessionDetails {
  username: string;
  tokenExists: boolean;
  tokenLength: number;
  expiresAt: string;
  timeUntilExpiry: number;
  sessionAge: number;
  authMethod?: string;
  apiUrl?: string;
}

interface ApiTestResult {
  success: boolean;
  responseTime: number;
  deviceCount?: number;
  error?: string;
  strategy?: string;
}

interface DiagnosticResult {
  success: boolean;
  session?: SessionDetails;
  apiTest?: ApiTestResult;
  overall_status?: string;
  recommendations?: string[];
  error?: string;
  message?: string;
}

const GP51DiagnosticsPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      console.log('🧪 Starting GP51 diagnostics...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'test_connection' }
      });

      if (error) {
        throw new Error(error.message || 'Diagnostics failed');
      }

      console.log('📊 Diagnostics response:', data);
      setResults(data);
      setLastRun(new Date());

      if (data.success) {
        toast({
          title: "Diagnostics Completed",
          description: "GP51 connection diagnostics completed successfully"
        });
      } else {
        toast({
          title: "Diagnostics Issues Found",
          description: data.error || "Some issues were detected",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      const errorResult: DiagnosticResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Diagnostics failed'
      };
      setResults(errorResult);
      setLastRun(new Date());

      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" />Degraded</Badge>;
      default:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Critical</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Connection Diagnostics</CardTitle>
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            size="sm"
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {lastRun && (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last run: {lastRun.toLocaleString()}
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Overall Status:</span>
              {results.success ? getStatusBadge(results.overall_status) : getStatusBadge('critical')}
            </div>

            {/* Session Information */}
            {results.session && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  GP51 Session Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium">Username</div>
                      <div className="text-sm text-gray-600">{results.session.username}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <Key className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium">Token Status</div>
                      <div className="text-sm text-gray-600">
                        {results.session.tokenExists ? `Valid (${results.session.tokenLength} chars)` : 'Missing'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium">Expires In</div>
                      <div className="text-sm text-gray-600">{formatTime(results.session.timeUntilExpiry)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                    <Timer className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="text-sm font-medium">Session Age</div>
                      <div className="text-sm text-gray-600">{formatTime(results.session.sessionAge)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Auth Method: {results.session.authMethod} | 
                  Expires: {new Date(results.session.expiresAt).toLocaleString()}
                </div>
              </div>
            )}

            {/* API Test Results */}
            {results.apiTest && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  GP51 API Test Results
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`flex items-center gap-2 p-2 rounded ${results.apiTest.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    {results.apiTest.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium">Connection</div>
                      <div className="text-sm text-gray-600">
                        {results.apiTest.success ? 'Success' : 'Failed'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Timer className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium">Response Time</div>
                      <div className="text-sm text-gray-600">{results.apiTest.responseTime}ms</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <Database className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium">Devices Found</div>
                      <div className="text-sm text-gray-600">{results.apiTest.deviceCount || 0}</div>
                    </div>
                  </div>
                </div>
                
                {results.apiTest.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>API Error:</strong> {results.apiTest.error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Test Strategy: {results.apiTest.strategy}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {results.recommendations && results.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recommendations:</h4>
                <div className="space-y-1">
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {results.error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error:</strong> {results.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!results && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Click "Run Diagnostics" to test GP51 connection</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51DiagnosticsPanel;
