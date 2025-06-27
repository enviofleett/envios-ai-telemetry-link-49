
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Save, Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabaseGP51AuthService } from '@/services/gp51/SupabaseGP51AuthService';
import { useToast } from '@/hooks/use-toast';

const GP51CredentialManager: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(supabaseGP51AuthService.getSessionStatus());
  const { toast } = useToast();

  // Load session status on mount
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      try {
        await supabaseGP51AuthService.loadExistingSession();
        setSessionStatus(supabaseGP51AuthService.getSessionStatus());
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const testCredentials = async () => {
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const result = await supabaseGP51AuthService.authenticate(
        credentials.username, 
        credentials.password
      );

      if (result.success) {
        setSessionStatus(supabaseGP51AuthService.getSessionStatus());
        setCredentials({ username: '', password: '' }); // Clear for security
        
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${result.username}`,
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: result.error || 'Invalid credentials',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : 'Authentication failed',
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const disconnect = async () => {
    try {
      await supabaseGP51AuthService.disconnect();
      setSessionStatus(supabaseGP51AuthService.getSessionStatus());
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from GP51",
      });
    } catch (error) {
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect cleanly",
        variant: "destructive",
      });
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const isValid = await supabaseGP51AuthService.refreshSession();
      setSessionStatus(supabaseGP51AuthService.getSessionStatus());
      
      if (!isValid) {
        toast({
          title: "Session Expired",
          description: "Please re-authenticate with GP51",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-gray-500" />;
    if (sessionStatus.isAuthenticated) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (sessionStatus.isAuthenticated) return 'border-green-200 bg-green-50';
    if (sessionStatus.isExpired) return 'border-red-200 bg-red-50';
    return 'border-gray-200';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          GP51 Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <Alert className={getStatusColor()}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <AlertDescription className="flex-1">
              {sessionStatus.isAuthenticated ? (
                <div>
                  <strong>Connected to GP51</strong> as {sessionStatus.username}
                  <br />
                  <span className="text-sm text-gray-600">
                    Session expires: {sessionStatus.expiresAt?.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div>
                  <strong>Not connected to GP51</strong>
                  <br />
                  <span className="text-sm text-gray-600">
                    {sessionStatus.isExpired ? 'Session expired - please re-authenticate' : 'Please enter your GP51 credentials'}
                  </span>
                </div>
              )}
            </AlertDescription>
            {sessionStatus.isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="ml-2"
              >
                Disconnect
              </Button>
            )}
          </div>
        </Alert>

        {/* Authentication Form */}
        {!sessionStatus.isAuthenticated && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">GP51 Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your GP51 username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                disabled={isLoading || isTesting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">GP51 Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your GP51 password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isLoading || isTesting}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={testCredentials}
              disabled={isLoading || isTesting || !credentials.username || !credentials.password}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Authenticate with GP51
                </>
              )}
            </Button>
          </div>
        )}

        {/* Actions for authenticated users */}
        {sessionStatus.isAuthenticated && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshStatus}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Refresh Status'
              )}
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <Alert>
          <AlertDescription>
            <strong>Security:</strong> All authentication is handled securely through Supabase Edge Functions. 
            Your GP51 credentials are never stored permanently and sessions are automatically managed.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GP51CredentialManager;
