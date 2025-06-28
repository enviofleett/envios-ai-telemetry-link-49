
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, Loader2 } from 'lucide-react';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';

const GPS51ConnectionStatus: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const { testConnection, isAuthenticated } = useGPS51Integration();

  const handleTestConnection = async () => {
    setIsTesting(true);
    const startTime = Date.now();
    
    try {
      const success = await testConnection();
      const responseTime = Date.now() - startTime;
      
      setTestResult({
        success,
        responseTime,
        timestamp: new Date()
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
        timestamp: new Date()
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Activity className="h-5 w-5 text-blue-400" />
          Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Authentication Status:</span>
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400">GPS51 API Endpoint:</span>
            <span className="text-sm text-gray-300 font-mono">
              gps51.com/webapi
            </span>
          </div>
        </div>

        {/* Connection Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Connection Test:</span>
            <Button
              onClick={handleTestConnection}
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.success 
                ? 'bg-green-900/20 border-green-700' 
                : 'bg-red-900/20 border-red-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </span>
                </div>
                <Badge variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? 'PASS' : 'FAIL'}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm">
                {testResult.responseTime && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>Response time: {testResult.responseTime}ms</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>Tested: {testResult.timestamp.toLocaleTimeString()}</span>
                </div>
                
                {testResult.error && (
                  <div className="text-red-400 text-xs mt-2">
                    Error: {testResult.error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Server Information */}
        <div className="pt-3 border-t border-gray-700">
          <h4 className="font-medium text-white mb-2">Server Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Protocol:</span>
              <span className="text-white">HTTPS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Timeout:</span>
              <span className="text-white">30s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Retry Policy:</span>
              <span className="text-white">None</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SSL Verification:</span>
              <span className="text-green-400">Enabled</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GPS51ConnectionStatus;
