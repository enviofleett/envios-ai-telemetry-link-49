
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, LogOut, Shield } from 'lucide-react';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';

const GPS51AuthenticationForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError
  } = useGPS51Integration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      return;
    }

    const success = await login(username.trim(), password);
    if (success) {
      setPassword(''); // Clear password on successful login
    }
  };

  const handleLogout = () => {
    logout();
    setUsername('');
    setPassword('');
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-blue-400" />
          GPS51 Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-700">
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
                <Shield className="h-4 w-4" />
                <span className="font-medium">Connected to GPS51</span>
              </div>
              <p className="text-sm text-green-300 mt-1">
                Authentication successful. You can now access GPS51 services.
              </p>
            </div>
            
            <Button
              onClick={handleLogout}
              disabled={isLoading}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Disconnect
            </Button>
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
              <p>• Passwords are securely hashed using MD5</p>
              <p>• Rate limiting: 5 attempts per 15 minutes</p>
              <p>• Account lockout after failed attempts</p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default GPS51AuthenticationForm;
