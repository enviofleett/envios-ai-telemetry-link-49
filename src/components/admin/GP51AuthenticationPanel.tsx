
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useGP51AuthConsolidated } from '@/hooks/useGP51AuthConsolidated';

const GP51AuthenticationPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const {
    isAuthenticated,
    isLoading,
    error,
    username: authenticatedUsername,
    login,
    logout,
    checkConnection,
    clearError
  } = useGP51AuthConsolidated();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      return;
    }

    const result = await login(username, password);
    if (result.success) {
      setPassword(''); // Clear password on successful login
    }
  };

  const handleRefreshStatus = async () => {
    setIsCheckingConnection(true);
    try {
      await checkConnection();
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUsername('');
    setPassword('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>GP51 Authentication</span>
          {isAuthenticated ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-auto p-1"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✅ Connected to GP51 as: <strong>{authenticatedUsername}</strong>
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleRefreshStatus}
                disabled={isCheckingConnection}
                variant="outline"
                className="flex-1"
              >
                {isCheckingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Status
              </Button>
              
              <Button
                onClick={handleLogout}
                disabled={isLoading}
                variant="destructive"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GP51 username"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter GP51 password"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                'Connect to GP51'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51AuthenticationPanel;
