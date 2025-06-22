
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, TestTube, Wifi, WifiOff } from 'lucide-react';
import { gp51EndpointTester, type EndpointTestResult } from '@/utils/gp51-endpoint-tester';

const GP51EndpointTester: React.FC = () => {
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [connectivityResults, setConnectivityResults] = useState<EndpointTestResult[]>([]);
  const [authResults, setAuthResults] = useState<EndpointTestResult[]>([]);
  const [showCurlCommands, setShowCurlCommands] = useState(false);

  const testConnectivity = async () => {
    setIsTestingConnectivity(true);
    setConnectivityResults([]);
    
    try {
      const results = await gp51EndpointTester.testConnectivity();
      setConnectivityResults(results);
      console.log('Connectivity test results:', results);
    } catch (error) {
      console.error('Connectivity test failed:', error);
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  const testAuthentication = async () => {
    setIsTestingAuth(true);
    setAuthResults([]);
    
    try {
      // Use test credentials - in real implementation, get from secure storage
      const results = await gp51EndpointTester.testAuthentication('testuser', 'testpass');
      setAuthResults(results);
      console.log('Authentication test results:', results);
    } catch (error) {
      console.error('Authentication test failed:', error);
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
      if (result.isReachable && result.responseData && !result.responseData.includes('error')) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      } else if (result.isReachable) {
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
      if (result.isReachable && result.responseData && !result.responseData.includes('error')) {
        return <Badge className="bg-green-100 text-green-800">Auth Success</Badge>;
      } else if (result.isReachable) {
        return <Badge className="bg-yellow-100 text-yellow-800">Auth Failed</Badge>;
      } else {
        return <Badge className="bg-red-100 text-red-800">No Response</Badge>;
      }
    }
  };

  const curlCommands = gp51EndpointTester.generateCurlCommands();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Endpoint Migration Tester</CardTitle>
          </div>
          <CardDescription>
            Test connectivity and authentication with the new GP51 API endpoint to ensure proper migration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
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
              disabled={isTestingAuth}
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
              {showCurlCommands ? 'Hide' : 'Show'} Curl Commands
            </Button>
          </div>

          {showCurlCommands && (
            <Alert>
              <AlertDescription>
                <div className="font-mono text-xs whitespace-pre-line bg-gray-100 p-3 rounded">
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
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectivityResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result)}
                    <div>
                      <p className="font-medium">{result.endpoint}</p>
                      {result.responseStatus && (
                        <p className="text-sm text-gray-600">Status: {result.responseStatus}</p>
                      )}
                      {result.error && (
                        <p className="text-sm text-red-600">Error: {result.error}</p>
                      )}
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
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {authResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result)}
                    <div>
                      <p className="font-medium text-sm">{result.endpoint}</p>
                      {result.responseStatus && (
                        <p className="text-xs text-gray-600">Status: {result.responseStatus}</p>
                      )}
                      {result.responseData && (
                        <p className="text-xs text-gray-600">
                          Response: {String(result.responseData).substring(0, 100)}...
                        </p>
                      )}
                      {result.error && (
                        <p className="text-xs text-red-600">Error: {result.error}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(result)}
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
