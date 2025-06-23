
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthStatus {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: string;
  lastChecked?: Date;
  error?: string;
}

const GP51AuthenticationPanel: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    apiUrl: 'https://www.gps51.com/webapi'
  });
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        setAuthStatus({
          isAuthenticated: false,
          error: error.message,
          lastChecked: new Date()
        });
        return;
      }

      if (data.success) {
        setAuthStatus({
          isAuthenticated: true,
          username: data.username,
          tokenExpiresAt: data.expiresAt,
          lastChecked: new Date()
        });
      } else {
        setAuthStatus({
          isAuthenticated: false,
          error: data.error,
          lastChecked: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus({
        isAuthenticated: false,
        error: 'Failed to check authentication status',
        lastChecked: new Date()
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'authenticate',
          username: credentials.username,
          password: credentials.password,
          apiUrl: credentials.apiUrl
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${data.username}`,
        });

        setAuthStatus({
          isAuthenticated: true,
          username: data.username,
          tokenExpiresAt: data.tokenExpiresAt,
          lastChecked: new Date()
        });

        // Clear form
        setCredentials({
          username: '',
          password: '',
          apiUrl: 'https://www.gps51.com/webapi'
        });
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('GP51 authentication failed:', error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });

      setAuthStatus({
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        lastChecked: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isChecking) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (authStatus.isAuthenticated) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (isChecking) {
      return <Badge variant="secondary">Checking...</Badge>;
    }
    if (authStatus.isAuthenticated) {
      return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
    }
    return <Badge variant="destructive">Not Connected</Badge>;
  };

  const isTokenExpiringSoon = () => {
    if (!authStatus.tokenExpiresAt) return false;
    const expiresAt = new Date(authStatus.tokenExpiresAt);
    const hoursUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 2; // Warn if expires within 2 hours
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>GP51 Authentication</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              {getStatusBadge()}
            </div>
          </div>
          <CardDescription>
            Configure your GP51 credentials for vehicle data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authStatus.isAuthenticated ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully authenticated as <strong>{authStatus.username}</strong>
                  {authStatus.tokenExpiresAt && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Token expires: {new Date(authStatus.tokenExpiresAt).toLocaleString()}
                      {isTokenExpiringSoon() && (
                        <span className="text-orange-600 font-medium"> (expires soon)</span>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={checkAuthStatus}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Refresh Status
                    </>
                  )}
                </Button>
                
                {(isTokenExpiringSoon() || !authStatus.isAuthenticated) && (
                  <Button 
                    onClick={() => setAuthStatus({ isAuthenticated: false })}
                    variant="outline"
                  >
                    Re-authenticate
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {authStatus.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{authStatus.error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Your GP51 username"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Your GP51 password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiUrl">API URL (Optional)</Label>
                <Input
                  id="apiUrl"
                  type="url"
                  value={credentials.apiUrl}
                  onChange={(e) => setCredentials(prev => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder="https://www.gps51.com/webapi"
                  disabled={isLoading}
                />
              </div>

              <Button 
                onClick={handleAuthenticate} 
                disabled={isLoading || !credentials.username || !credentials.password}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Authenticate with GP51
                  </>
                )}
              </Button>
            </div>
          )}

          {authStatus.lastChecked && (
            <div className="text-xs text-muted-foreground">
              Last checked: {authStatus.lastChecked.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51AuthenticationPanel;
