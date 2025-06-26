
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const GP51Settings: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

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

    try {
      console.log('🔐 Starting GP51 authentication...');
      
      const result = await authenticate(credentials.username, credentials.password);
      
      if (result.success) {
        setConnectionSuccess(true);
        setConnectionError(null);
        toast({
          title: "Connection Successful",
          description: `Successfully connected to GP51 as ${credentials.username}`,
        });
      } else {
        const errorMessage = result.error || 'Authentication failed - please check your credentials';
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
    // Add disconnect logic here if needed
  };

  const getConnectionStatus = () => {
    if (isConnecting) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: 'Connecting...',
        color: 'text-blue-600'
      };
    }
    
    if (connectionSuccess || isAuthenticated) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Connected',
        color: 'text-green-600'
      };
    }
    
    if (connectionError || error) {
      return {
        icon: <XCircle className="h-4 w-4" />,
        text: 'Disconnected',
        color: 'text-red-600'
      };
    }
    
    return {
      icon: <XCircle className="h-4 w-4" />,
      text: 'Not Connected',
      color: 'text-gray-600'
    };
  };

  const status = getConnectionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          GP51 Platform Connection
          <div className={`flex items-center gap-1 ${status.color}`}>
            {status.icon}
            <span className="text-sm">{status.text}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status Alert */}
        {connectionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Connection Failed:</strong> {connectionError}
              <br />
              <small className="text-xs mt-1 block">
                Please verify your GP51 credentials and ensure the GP51 platform is accessible.
              </small>
            </AlertDescription>
          </Alert>
        )}

        {connectionSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully connected to GP51 platform as <strong>{credentials.username}</strong>
            </AlertDescription>
          </Alert>
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

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
            <strong>Debug Info:</strong>
            <div>Authentication State: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Service Error: {error || 'None'}</div>
            <div>Connection Error: {connectionError || 'None'}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51Settings;
