
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, AlertCircle, Loader2, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthStatus {
  isAuthenticated: boolean;
  username?: string;
  expiresAt?: string;
  sessionHealth?: 'healthy' | 'expired' | 'invalid';
  error?: string;
}

const GP51AuthenticationPanel: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: 'octopus',
    password: ''
  });
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (error) {
        console.error('Failed to check GP51 status:', error);
        setAuthStatus({ 
          isAuthenticated: false, 
          error: 'Failed to check authentication status',
          sessionHealth: 'invalid'
        });
        return;
      }

      const now = new Date();
      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      const isExpired = expiresAt && expiresAt <= now;

      setAuthStatus({
        isAuthenticated: data.connected && !isExpired,
        username: data.username,
        expiresAt: data.expiresAt,
        sessionHealth: !data.connected ? 'invalid' : (isExpired ? 'expired' : 'healthy'),
        error: data.error
      });
    } catch (error) {
      console.error('Error checking GP51 status:', error);
      setAuthStatus({ 
        isAuthenticated: false, 
        error: 'Connection check failed',
        sessionHealth: 'invalid'
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!credentials.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Password is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Starting GP51 authentication process...');

      // Clear existing sessions first
      await supabase.functions.invoke('settings-management', {
        body: { action: 'clear-gp51-sessions' }
      });

      // Authenticate with new credentials
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: credentials.username,
          password: credentials.password,
          apiUrl: 'https://www.gps51.com'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      console.log('✅ GP51 authentication successful');
      
      toast({
        title: "Authentication Successful",
        description: `Successfully authenticated with GP51 as ${credentials.username}`,
      });

      // Clear password for security
      setCredentials(prev => ({ ...prev, password: '' }));
      
      // Refresh status
      await checkAuthenticationStatus();

    } catch (error) {
      console.error('❌ GP51 authentication failed:', error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSessions = async () => {
    try {
      setIsLoading(true);
      await supabase.functions.invoke('settings-management', {
        body: { action: 'clear-gp51-sessions' }
      });
      
      toast({
        title: "Sessions Cleared",
        description: "All GP51 sessions have been cleared",
      });
      
      await checkAuthenticationStatus();
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear GP51 sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isCheckingStatus) {
      return (
        <Badge variant="secondary">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Checking...
        </Badge>
      );
    }

    if (authStatus.isAuthenticated && authStatus.sessionHealth === 'healthy') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Authenticated
        </Badge>
      );
    }

    if (authStatus.sessionHealth === 'expired') {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Session Expired
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Not Authenticated
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>GP51 Authentication Panel</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Current Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Authentication:</span>
              <span className={authStatus.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {authStatus.isAuthenticated ? 'Active' : 'Inactive'}
              </span>
            </div>
            {authStatus.username && (
              <div className="flex justify-between">
                <span>Username:</span>
                <span className="font-mono">{authStatus.username}</span>
              </div>
            )}
            {authStatus.expiresAt && (
              <div className="flex justify-between">
                <span>Expires:</span>
                <span>{new Date(authStatus.expiresAt).toLocaleString()}</span>
              </div>
            )}
            {authStatus.error && (
              <div className="text-red-600 text-xs">
                Error: {authStatus.error}
              </div>
            )}
          </div>
        </div>

        {/* Authentication Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              disabled={isLoading}
              className="font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              disabled={isLoading}
              placeholder="Enter GP51 password"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAuthenticate}
            disabled={isLoading || !credentials.password.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Authenticate GP51
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClearSessions}
            disabled={isLoading}
          >
            Clear Sessions
          </Button>
          
          <Button
            variant="outline"
            onClick={checkAuthenticationStatus}
            disabled={isLoading}
          >
            Refresh Status
          </Button>
        </div>

        {/* Help Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Authentication Instructions:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>Use your GP51 platform credentials</li>
                <li>Default username is 'octopus' for admin access</li>
                <li>Authentication sessions are automatically managed</li>
                <li>Clear sessions if you experience connection issues</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GP51AuthenticationPanel;
