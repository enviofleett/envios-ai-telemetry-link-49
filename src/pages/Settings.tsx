
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Settings as SettingsIcon } from 'lucide-react';
import { telemetryApi } from '@/services/telemetryApi';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

const Settings: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    username?: string;
    expiresAt?: string;
  }>({ connected: false });
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  const { toast } = useToast();

  useEffect(() => {
    checkGP51Status();
  }, []);

  const checkGP51Status = async () => {
    try {
      const status = await telemetryApi.getGP51Status();
      setConnectionStatus({
        connected: status.connected,
        username: status.username,
        expiresAt: status.expiresAt
      });
    } catch (error) {
      console.error('Failed to check GP51 status:', error);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please enter both username and password'
      });
      return;
    }

    setIsLoading(true);
    setFeedback({ type: null, message: '' });

    try {
      const response = await telemetryApi.saveGP51Credentials(username, password);
      
      if (response.success) {
        setFeedback({
          type: 'success',
          message: response.message || 'GP51 credentials saved and connection established successfully!'
        });
        
        toast({
          title: "Success",
          description: "GP51 credentials saved successfully!",
        });

        // Refresh connection status
        await checkGP51Status();
        
        // Clear password field for security
        setPassword('');
      } else {
        setFeedback({
          type: 'error',
          message: response.error || 'Failed to save credentials'
        });
        
        toast({
          title: "Error",
          description: response.error || 'Failed to save credentials',
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save credentials';
      setFeedback({
        type: 'error',
        message: errorMessage
      });
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600">Configure your Envio Console system settings</p>
          </div>
        </div>

        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {connectionStatus.connected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>GP51 LIVE Platform Status</span>
            </CardTitle>
            <CardDescription>
              Current connection status to the GP51 telemetry platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  connectionStatus.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {connectionStatus.connected && connectionStatus.username && (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Username:</span>
                    <span>{connectionStatus.username}</span>
                  </div>
                  {connectionStatus.expiresAt && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Session Expires:</span>
                      <span>{formatExpirationDate(connectionStatus.expiresAt)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* GP51 Credentials Card */}
        <Card>
          <CardHeader>
            <CardTitle>GP51 LIVE Platform Credentials</CardTitle>
            <CardDescription>
              Enter your GP51 LIVE account details to enable vehicle telemetry data access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gp51-username">GP51 Username</Label>
                <Input
                  id="gp51-username"
                  type="text"
                  placeholder="Enter your GP51 username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gp51-password">GP51 Password</Label>
                <div className="relative">
                  <Input
                    id="gp51-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your GP51 password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Password will be securely handled and encrypted by Envio
                </p>
              </div>

              {feedback.type && (
                <Alert className={feedback.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <AlertDescription className={feedback.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {feedback.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting to GP51...
                  </>
                ) : (
                  'Save & Connect to GP51'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
