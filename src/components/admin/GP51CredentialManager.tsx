
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabaseGP51AuthService } from '@/services/gp51/SupabaseGP51AuthService';

const GP51CredentialManager: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const status = supabaseGP51AuthService.getSessionStatus();
      setIsAuthenticated(status.isAuthenticated);
      setSessionInfo(status);
      
      if (status.isAuthenticated && status.currentUsername) {
        setCredentials(prev => ({ ...prev, username: status.currentUsername || '' }));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const handleAuthenticate = async () => {
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await supabaseGP51AuthService.authenticate(
        credentials.username,
        credentials.password
      );

      if (result.success) {
        setIsAuthenticated(true);
        await checkAuthStatus();
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${credentials.username}`,
        });
        // Clear password for security
        setCredentials(prev => ({ ...prev, password: '' }));
      } else {
        setError(result.error || 'Authentication failed');
        toast({
          title: "Authentication Failed",
          description: result.error || 'Invalid GP51 credentials',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication error';
      setError(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await supabaseGP51AuthService.logout();
      setIsAuthenticated(false);
      setSessionInfo(null);
      setCredentials({ username: '', password: '' });
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from GP51",
      });
    } catch (error) {
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect from GP51",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatus = () => {
    if (isAuthenticated && sessionInfo) {
      return {
        status: 'connected',
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        status: 'disconnected',
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          GP51 Secure Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className={`p-3 rounded-lg border ${connectionStatus.bgColor} ${connectionStatus.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${connectionStatus.color}`} />
              <span className="font-medium">
                {connectionStatus.status === 'connected' ? 'Connected to GP51' : 'Not Connected'}
              </span>
            </div>
            <Badge variant={connectionStatus.status === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus.status}
            </Badge>
          </div>
          
          {sessionInfo && isAuthenticated && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Username: <span className="font-mono">{sessionInfo.currentUsername}</span></p>
              <p>Expires: {sessionInfo.expiresAt ? new Date(sessionInfo.expiresAt).toLocaleString() : 'Unknown'}</p>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isAuthenticated ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">GP51 Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your GP51 username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">GP51 Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your GP51 password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
              />
            </div>

            <Button 
              onClick={handleAuthenticate} 
              disabled={isLoading || !credentials.username || !credentials.password}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Connect to GP51
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Successfully connected to GP51</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                You can now access GP51 device data and real-time positions.
              </p>
            </div>

            <Button 
              onClick={handleDisconnect} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect from GP51'
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>🔒 Your credentials are securely encrypted and stored using Supabase Edge Functions</p>
          <p>🌍 All GP51 API calls are made server-side for enhanced security</p>
          <p>🔄 Sessions are automatically managed and refreshed as needed</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51CredentialManager;
