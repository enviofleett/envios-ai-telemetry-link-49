
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, AlertCircle, CheckCircle, WifiOff } from 'lucide-react';
import { telemetryApi } from '@/services/telemetryApi';

interface LoginFormProps {
  onLoginSuccess: (vehicles: any[]) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  const testConnection = async () => {
    setIsTestingConnection(true);
    setError('');
    
    try {
      console.log('Testing GP51 connection...');
      
      const result = await telemetryApi.testConnection();
      
      if (result.success) {
        setConnectionStatus('connected');
        console.log('GP51 connection test successful');
      } else {
        setConnectionStatus('failed');
        setError(result.error || 'Connection test failed');
        console.error('GP51 connection test failed:', result.error);
      }
    } catch (err) {
      setConnectionStatus('failed');
      setError('Network error during connection test. Please check your internet connection.');
      console.error('Connection test error:', err);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Starting authentication with GP51 telemetry system...');
      
      const result = await telemetryApi.authenticate(username, password);
      
      if (result.success && result.vehicles) {
        console.log('Authentication successful, received vehicles:', result.vehicles);
        setConnectionStatus('connected');
        onLoginSuccess(result.vehicles);
      } else {
        setConnectionStatus('failed');
        
        // Enhanced error messages based on the error type
        if (result.error?.includes('service unavailable')) {
          setError('GP51 service is currently unavailable. Please try again later or contact support.');
        } else if (result.error?.includes('connection')) {
          setError('Unable to connect to GP51 servers. Please check your internet connection and try again.');
        } else if (result.error?.includes('credentials')) {
          setError('Invalid username or password. Please check your credentials and try again.');
        } else {
          setError(result.error || 'Authentication failed. Please check your credentials and try again.');
        }
        
        console.error('Authentication failed:', result.error);
      }
    } catch (err) {
      setConnectionStatus('failed');
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <WifiOff className="h-3 w-3 mr-1" />
            Connection Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Envio Vehicle Console
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Connect to GP51 Telemetry System
            </CardDescription>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">GP51 Status:</span>
            {getConnectionStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Test Button */}
          <Button
            type="button"
            variant="outline"
            onClick={testConnection}
            disabled={isTestingConnection || isLoading}
            className="w-full"
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test GP51 Connection'
            )}
          </Button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your GP51 username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || isTestingConnection}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || isTestingConnection}
              />
            </div>
            
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={isLoading || isTestingConnection}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting to GP51...
                </>
              ) : (
                'Connect to Telemetry'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
