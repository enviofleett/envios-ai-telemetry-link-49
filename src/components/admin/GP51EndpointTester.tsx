
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, TestTube, Wifi, WifiOff, Info, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { gp51EndpointTester, type EndpointTestResult } from '@/utils/gp51-endpoint-tester';

const GP51EndpointTester: React.FC = () => {
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [connectivityResults, setConnectivityResults] = useState<EndpointTestResult[]>([]);
  const [authResults, setAuthResults] = useState<EndpointTestResult[]>([]);
  const [showCurlCommands, setShowCurlCommands] = useState(false);
  const [testCredentials, setTestCredentials] = useState({ username: 'octopus', password: '' });
  const { toast } = useToast();

  const testConnectivity = async () => {
    setIsTestingConnectivity(true);
    setConnectivityResults([]);
    
    try {
      const results = await gp51EndpointTester.testConnectivity();
      setConnectivityResults(results);
      
      const reachableCount = results.filter(r => r.isReachable).length;
      toast({
        title: "Connectivity Test Complete",
        description: `${reachableCount}/${results.length} endpoints are reachable`,
        variant: reachableCount > 0 ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Connectivity test failed:', error);
      toast({
        title: "Connectivity Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  const testAuthentication = async () => {
    if (!testCredentials.username || !testCredentials.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both username and password for testing",
        variant: "destructive"
      });
      return;
    }

    setIsTestingAuth(true);
    setAuthResults([]);
    
    try {
      const results = await gp51EndpointTester.testAuthentication(
        testCredentials.username, 
        testCredentials.password
      );
      setAuthResults(results);
      
      const successfulCount = results.filter(r => r.isReachable && r.responseStatus === 200 && r.contentLength && r.contentLength > 0).length;
      toast({
        title: "Authentication Test Complete",
        description: `${successfulCount}/${results.length} patterns returned valid responses`,
        variant: successfulCount > 0 ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Authentication test failed:', error);
      toast({
        title: "Authentication Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  const getStatusIcon = (result: EndpointTestResult) => {
    if (result.testType === 'connectivity') {
      return result.isReachable ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      );
    } else {
      // Authentication test
      if (result.isReachable && result.responseStatus === 200 && result.contentLength && result.contentLength > 0) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      } else if (result.contentLength === 0) {
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      } else {
        return <XCircle className="h-4 w-4 text-red-500" />;
      }
    }
  };

  const getStatusBadge = (result: EndpointTestResult) => {
    if (result.testType === 'connectivity') {
      return result.isReachable ? (
        <Badge className="bg-green-100 text-green-800">Reachable</Badge>
      ) : (
        <Badge className="bg-red-100 text-red-800">Unreachable</Badge>
      );
    } else {
      if (result.isReachable && result.responseStatus === 200 && result.contentLength && result.contentLength > 0) {
        return <Badge className="bg-green-100 text-green-800">Valid Response</Badge>;
      } else if (result.contentLength === 0) {
        return <Badge className="bg-yellow-100 text-yellow-800">Empty Response</Badge>;
      } else {
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "cURL commands copied successfully"
    });
  };

  const curlCommands = gp51EndpointTester.generateCurlCommands(
    testCredentials.username, 
    testCredentials.password
  );

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Endpoint Migration Tester</CardTitle>
          </div>
          <CardDescription>
            Test connectivity and authentication with different GP51 API endpoint patterns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Update the <code>GP51_API_BASE_URL</code> secret in Supabase to <code>https://api.gps51.com</code> before testing.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-username">Test Username</Label>
              <Input
                id="test-username"
                value={testCredentials.username}
                onChange={(e) => setTestCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-password">Test Password</Label>
              <Input
                id="test-password"
                type="password"
                value={testCredentials.password}
                onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={testConnectivity}
              disabled={isTestingConnectivity}
              className="flex items-center gap-2"
            >
              {isTestingConnectivity ? (
                <WifiOff className="h-4 w-4 animate-pulse" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              {isTestingConnectivity ? 'Testing...' : 'Test Connectivity'}
            </Button>
            
            <Button
              onClick={testAuthentication}
              disabled={isTestingAuth || !testCredentials.username || !testCredentials.password}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isTestingAuth ? (
                <TestTube className="h-4 w-4 animate-pulse" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              {isTestingAuth ? 'Testing Auth...' : 'Test Authentication'}
            </Button>

            <Button
              onClick={() => setShowCurlCommands(!showCurlCommands)}
              variant="ghost"
              size="sm"
            >
              {showCurlCommands ? 'Hide' : 'Show'} cURL Commands
            </Button>
          </div>

          {showCurlCommands && (
            <Alert>
              <AlertDescription>
                <div className="flex items-center justify-between mb-2">
                  <strong>cURL Test Commands:</strong>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(curlCommands.join('\n'))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="font-mono text-xs whitespace-pre-line bg-gray-100 p-3 rounded max-h-60 overflow-y-auto">
                  {curlCommands.join('\n')}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connectivity Results */}
      {connectivityResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connectivity Test Results</CardTitle>
            <CardDescription>Testing basic reachability of GP51 endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectivityResults.map((result, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(result)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.endpoint}</p>
                      <div className="text-xs text-gray-600 space-y-1">
                        {result.responseStatus && (
                          <p>Status: {result.responseStatus}</p>
                        )}
                        {result.contentLength !== undefined && (
                          <p>Content-Length: {result.contentLength}</p>
                        )}
                        {result.error && (
                          <p className="text-red-600">Error: {result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(result)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authentication Results */}
      {authResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Authentication Test Results</CardTitle>
            <CardDescription>Testing different request patterns for GP51 authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {authResults.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result)}
                      <span className="text-sm font-medium">{result.requestFormat}</span>
                    </div>
                    {getStatusBadge(result)}
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1 ml-6">
                    <p><strong>Method:</strong> {result.method}</p>
                    <p className="truncate"><strong>URL:</strong> {result.endpoint}</p>
                    {result.responseStatus && (
                      <p><strong>Status:</strong> {result.responseStatus}</p>
                    )}
                    {result.contentLength !== undefined && (
                      <p><strong>Content-Length:</strong> {result.contentLength}</p>
                    )}
                    {result.responseData && (
                      <div>
                        <p><strong>Response:</strong></p>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {typeof result.responseData === 'string' 
                            ? result.responseData.substring(0, 200) + (result.responseData.length > 200 ? '...' : '')
                            : JSON.stringify(result.responseData, null, 2).substring(0, 200) + '...'
                          }
                        </pre>
                      </div>
                    )}
                    {result.error && (
                      <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GP51EndpointTester;
