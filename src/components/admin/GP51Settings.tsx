
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Wifi, RefreshCw } from 'lucide-react';

const GP51Settings: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const { toast } = useToast();
  const { authenticate, isAuthenticated, isLoading, error } = useUnifiedGP51Service();

  const handleAuthenticate = async () => {
    if (!credentials.username || !credentials.password) {
      setConnectionError('Please enter both username and password');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    setConnectionSuccess(false);
    setConnectionDetails(null);

    try {
      console.log('🔐 Starting GP51 authentication...', { username: credentials.username });
      
      const startTime = Date.now();
      const result = await authenticate(credentials.username, credentials.password);
      const responseTime = Date.now() - startTime;
      
      console.log('🔐 Authentication result:', result);
      
      setConnectionDetails({
        responseTime,
        timestamp: new Date().toISOString(),
        result
      });
      
      if (result.success) {
        setConnectionSuccess(true);
        setConnectionError(null);
        toast({
          title: "Connection Successful",
          description: `Successfully connected to GP51 as ${credentials.username} (${responseTime}ms)`,
        });
      } else {
        const errorMessage = result.error || result.cause || 'Authentication failed - please check your credentials';
        console.error('❌ Authentication failed:', errorMessage);
        setConnectionError(errorMessage);
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed unexpectedly';
      console.error('❌ GP51 authentication error:', err);
      setConnectionError(errorMessage);
      setConnectionDetails({
        responseTime: 0,
        timestamp: new Date().toISOString(),
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      });
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setConnectionSuccess(false);
    setConnectionError(null);
    setConnectionDetails(null);
    // Add disconnect logic here if needed
  };

  const testEdgeFunction = async () => {
    try {
      console.log('🧪 Testing edge function directly...');
      const response = await fetch('/api/gp51-hybrid-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'test',
          password: 'test'
        })
      });
      
      const data = await response.text();
      console.log('Edge function test response:', { status: response.status, data });
      
      toast({
        title: "Edge Function Test",
        description: `Status: ${response.status} - Check console for details`,
        variant: response.ok ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Edge function test failed:', error);
      toast({
        title: "Edge Function Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const getConnectionStatus = () => {
    if (isConnecting) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: 'Connecting...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      };
    }
    
    if (connectionSuccess || isAuthenticated) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Connected',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200'
      };
    }
    
    if (connectionError || error) {
      return {
        icon: <XCircle className="h-4 w-4" />,
        text: 'Failed',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200'
      };
    }
    
    return {
      icon: <Wifi className="h-4 w-4" />,
      text: 'Not Connected',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200'
    };
  };

  const status = getConnectionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>GP51 Platform Connection</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
          >
            Diagnostics
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Connection Status */}
        <div className={`p-3 rounded border ${status.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.icon}
              <span className={`font-medium ${status.color}`}>{status.text}</span>
            </div>
            {connectionDetails && (
              <span className="text-xs text-gray-500">
                {connectionDetails.responseTime}ms
              </span>
            )}
          </div>
        </div>

        {/* Enhanced Error Display */}
        {connectionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>Connection Failed:</strong> {connectionError}</div>
                <div className="text-xs">
                  Please verify your GP51 credentials and ensure the GP51 platform is accessible.
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConnectionError(null)}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testEdgeFunction}
                  >
                    Test Edge Function
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {connectionSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully connected to GP51 platform as <strong>{credentials.username}</strong>
              {connectionDetails && (
                <div className="text-xs mt-1">
                  Connected at {new Date(connectionDetails.timestamp).toLocaleString()}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostics Panel */}
        {showDiagnostics && (
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="font-medium mb-2">Connection Diagnostics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Authentication State:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Loading:</span>
                <span>{isLoading ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Error:</span>
                <span className="text-red-600">{error || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Connection Error:</span>
                <span className="text-red-600">{connectionError || 'None'}</span>
              </div>
              {connectionDetails && (
                <div className="mt-2 p-2 bg-white rounded text-xs">
                  <strong>Last Attempt Details:</strong>
                  <pre className="mt-1 overflow-x-auto">
                    {JSON.stringify(connectionDetails, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={testEdgeFunction}>
                Test Edge Function
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reload Page
              </Button>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="gp51-username">GP51 Username</Label>
            <Input
              id="gp51-username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your GP51 username"
              disabled={isConnecting}
            />
          </div>
          
          <div>
            <Label htmlFor="gp51-password">GP51 Password</Label>
            <Input
              id="gp51-password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your GP51 password"
              disabled={isConnecting}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!connectionSuccess && !isAuthenticated ? (
            <Button 
              onClick={handleAuthenticate}
              disabled={isConnecting || !credentials.username || !credentials.password}
              className="flex-1"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to GP51'
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="flex-1"
            >
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51Settings;
