import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGP51Auth } from '@/hooks/useGP51Auth';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  LogIn, 
  LogOut,
  Activity,
  Clock,
  AlertTriangle
} from 'lucide-react';

const GP51_USERNAME_STORAGE_KEY = 'gp51_last_username';

export const GP51AuthenticationPanel: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const { 
    isAuthenticated, 
    username, 
    tokenExpiresAt, 
    isLoading, 
    error,
    login, 
    logout, 
    healthCheck,
    clearError
  } = useGP51Auth();

  // Load saved username from localStorage on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem(GP51_USERNAME_STORAGE_KEY);
    if (savedUsername && !isAuthenticated) {
      setCredentials(prev => ({ ...prev, username: savedUsername }));
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username.trim() || !credentials.password.trim()) {
      return;
    }
    
    console.log('🔐 GP51AuthenticationPanel: Initiating login...');
    clearError();
    const result = await login(credentials.username, credentials.password);
    
    // Save username to localStorage on successful login
    if (result.success) {
      localStorage.setItem(GP51_USERNAME_STORAGE_KEY, credentials.username.trim());
    }
    
    // Clear password after login attempt for security
    setCredentials(prev => ({ ...prev, password: '' }));
  };

  const handleLogout = async () => {
    console.log('👋 GP51AuthenticationPanel: Initiating logout...');
    await logout();
    
    // Clear saved username and form on logout
    localStorage.removeItem(GP51_USERNAME_STORAGE_KEY);
    setCredentials({ username: '', password: '' });
  };

  const handleHealthCheck = async () => {
    console.log('🏥 GP51AuthenticationPanel: Running health check...');
    await healthCheck();
  };

  const handleRetryLogin = async () => {
    console.log('🔄 GP51AuthenticationPanel: Retrying login...');
    if (credentials.username.trim() && credentials.password.trim()) {
      clearError();
      const result = await login(credentials.username, credentials.password);
      
      // Save username on successful retry
      if (result.success) {
        localStorage.setItem(GP51_USERNAME_STORAGE_KEY, credentials.username.trim());
      }
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
    if (error) return <XCircle className="h-5 w-5 text-red-600" />;
    if (isAuthenticated) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Processing...';
    if (error) return 'Connection Error';
    if (isAuthenticated) return 'Connected';
    return 'Not Connected';
  };

  const formatExpiryTime = (expiresAt?: Date) => {
    if (!expiresAt) return 'Unknown';
    
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff <= 0) return 'Expired';
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          GP51 Authentication
        </CardTitle>
        <CardDescription>
          Secure authentication with GP51 telemetry service using enhanced error handling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{getStatusText()}</p>
              {isAuthenticated && username && (
                <p className="text-sm text-muted-foreground">
                  Logged in as: {username}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isAuthenticated ? "default" : error ? "destructive" : "secondary"}>
              {isAuthenticated ? 'Active' : error ? 'Error' : 'Inactive'}
            </Badge>
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleHealthCheck}
                disabled={isLoading}
              >
                <Activity className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            )}
          </div>
        </div>

        {/* Error Display Section */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryLogin}
                disabled={isLoading || !credentials.username.trim() || !credentials.password.trim()}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Token Expiry Info */}
        {isAuthenticated && tokenExpiresAt && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Token expires in:</strong> {formatExpiryTime(tokenExpiresAt)}
              <br />
              <span className="text-sm text-muted-foreground">
                Tokens are automatically renewed when needed
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Form */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">GP51 Username</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your GP51 username"
                disabled={isLoading}
                autoComplete="username"
                required
              />
              {credentials.username && localStorage.getItem(GP51_USERNAME_STORAGE_KEY) === credentials.username && (
                <p className="text-xs text-muted-foreground">
                  ✓ Username restored from previous session
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">GP51 Password</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your GP51 password"
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="showPassword" className="text-sm">
                Show password
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !credentials.username.trim() || !credentials.password.trim()}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isLoading ? 'Connecting...' : 'Connect to GP51'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully connected to GP51 telemetry service. 
                Authentication tokens are managed automatically with enhanced error recovery.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleLogout}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect from GP51
            </Button>
          </div>
        )}

        {/* Security Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>🔒 All communications use HTTPS encryption with 10-second timeout protection</p>
          <p>🔄 Tokens are automatically renewed before expiry with retry logic</p>
          <p>🏥 Connection health is monitored continuously with error recovery</p>
          <p>📊 All authentication attempts are logged for security and debugging</p>
          <p>🛡️ Enhanced MD5 implementation ensures cross-browser compatibility</p>
          <p>💾 Username is remembered for convenience (password never stored)</p>
        </div>
      </CardContent>
    </Card>
  );
};
