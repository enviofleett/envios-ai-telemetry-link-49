
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { gp51FallbackAuth, AuthenticationLevel } from '@/services/auth/GP51FallbackAuthService';

interface GP51LoginFormProps {
  onSuccess: (level: AuthenticationLevel) => void;
  onError: (error: string) => void;
}

const GP51LoginForm: React.FC<GP51LoginFormProps> = ({ onSuccess, onError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authLevel, setAuthLevel] = useState<AuthenticationLevel>('full');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await gp51FallbackAuth.authenticateWithFallback(username, password);
      
      if (result.success) {
        setAuthLevel(result.level);
        
        // Store offline session for future use
        if (result.user && result.session) {
          gp51FallbackAuth.storeOfflineSession(username, result.user, result.session);
        }
        
        onSuccess(result.level);
      } else {
        setError(result.error || 'Authentication failed');
        onError(result.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelIcon = (level: AuthenticationLevel) => {
    switch (level) {
      case 'full': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'degraded': return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'minimal': return <WifiOff className="h-4 w-4 text-orange-500" />;
      case 'offline': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getLevelDescription = (level: AuthenticationLevel) => {
    switch (level) {
      case 'full': return 'Full GP51 connectivity - All features available';
      case 'degraded': return 'Using cached GP51 data - Limited real-time features';
      case 'minimal': return 'Local authentication only - Basic features available';
      case 'offline': return 'Offline mode - View cached data only';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">GP51 Fleet Management</CardTitle>
          <CardDescription>
            Sign in with your GP51 credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">GP51 Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your GP51 username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">GP51 Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your GP51 password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              {getLevelIcon(authLevel)}
              <span className="text-sm text-gray-600">
                {getLevelDescription(authLevel)}
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>This system authenticates with GP51 platform</p>
            <p>Automatic fallback during service interruptions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51LoginForm;
