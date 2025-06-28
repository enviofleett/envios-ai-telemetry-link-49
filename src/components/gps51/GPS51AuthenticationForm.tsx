
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, LogOut, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';

const GPS51AuthenticationForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lastLoginAttempt, setLastLoginAttempt] = useState<Date | null>(null);
  
  const {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    testConnection
  } = useGPS51Integration();

  // Clear form on successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      setPassword('');
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      return;
    }

    setLastLoginAttempt(new Date());
    const success = await login(username.trim(), password);
    
    if (success) {
      console.log('✅ GPS51 authentication successful in form');
    }
  };

  const handleLogout = () => {
    logout();
    setUsername('');
    setPassword('');
    setLastLoginAttempt(null);
  };

  const handleTestConnection = async () => {
    const result = await testConnection();
    console.log('🔍 Connection test result:', result);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-blue-400" />
          GPS51 Authentication
          {isAuthenticated && (
            <CheckCircle className="h-4 w-4 text-green-400 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between text-red-400">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-auto p-1 text-red-400 hover:text-red-300"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Connected to GPS51</span>
              </div>
              <p className="text-sm text-green-300 mt-1">
                Authentication successful. You can now access GPS51 services.
              </p>
              {lastLoginAttempt && (
                <p className="text-xs text-green-400 mt-2">
                  Last login: {lastLoginAttempt.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={isLoading}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
              
              <Button
                onClick={handleLogout}
                disabled={isLoading}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GPS51 username"
                disabled={isLoading}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter GPS51 password"
                  disabled={isLoading}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  disabled={isLoading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Connect to GPS51
                </>
              )}
            </Button>

            <div className="text-sm text-gray-400 space-y-1">
              <p>• Secure authentication with GPS51 platform</p>
              <p>• Session persists across page refreshes</p>
              <p>• Automatic session management and renewal</p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default GPS51AuthenticationForm;
