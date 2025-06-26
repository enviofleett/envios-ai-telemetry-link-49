
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Server, Key, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { useState } from 'react';

export const GP51Settings: React.FC = () => {
  const {
    session,
    isConnected,
    isLoading,
    error,
    authenticate,
    logout,
    getConnectionHealth
  } = useUnifiedGP51Service();

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [health, setHealth] = useState<any>(null);

  const handleAuthenticate = async () => {
    if (!credentials.username || !credentials.password) {
      return;
    }

    setIsAuthenticating(true);
    try {
      await authenticate(credentials.username, credentials.password);
      setCredentials({ username: '', password: '' });
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTestConnection = async () => {
    try {
      const healthData = await getConnectionHealth();
      setHealth(healthData);
    } catch (error) {
      console.error('Connection test error:', error);
    }
  };

  const clearError = () => {
    // Error clearing logic if needed
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <div>
          <h2 className="text-xl font-semibold">GP51 Integration Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure your GP51 tracking system connection
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Connection Status
            </span>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  Authenticated as: <strong>{session.username}</strong>
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Session expires: {session.expiresAt.toLocaleString()}
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ 
                      ...prev, 
                      username: e.target.value 
                    }))}
                    placeholder="Enter GP51 username"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ 
                      ...prev, 
                      password: e.target.value 
                    }))}
                    placeholder="Enter GP51 password"
                  />
                </div>
              </div>
              <Button 
                onClick={handleAuthenticate}
                disabled={isAuthenticating || !credentials.username || !credentials.password}
                className="w-full"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Connect to GP51
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Health</span>
              <Button onClick={handleTestConnection} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {health.responseTime}ms
                </div>
                <div className="text-xs text-muted-foreground">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {health.activeDevices}
                </div>
                <div className="text-xs text-muted-foreground">Active Devices</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {health.lastCheck.toLocaleTimeString()}
                </div>
                <div className="text-xs text-muted-foreground">Last Check</div>
              </div>
            </div>

            {health.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {health.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm">{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={clearError} variant="ghost" size="sm">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GP51Settings;
