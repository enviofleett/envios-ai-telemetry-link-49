
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Database, CheckCircle, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAutoAuth } from '@/hooks/useAdminAutoAuth';
import { supabase } from '@/integrations/supabase/client';

const GP51Setup: React.FC = () => {
  const { user } = useAuth();
  const adminAutoAuth = useAdminAutoAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAdmin = user?.email === 'chudesyl@gmail.com';

  const handleInputChange = (field: 'username' | 'password') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError(null);
  };

  const handleRetryAdminAuth = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'admin-auto-auth' }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Admin Access Granted",
        description: "Successfully authenticated with GP51",
      });
      
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Auto-authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGP51Setup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: credentials.username.trim(),
          password: credentials.password,
          testOnly: false
        }
      });

      if (functionError) throw new Error(functionError.message);
      if (!data.success) throw new Error(data.error || 'GP51 authentication failed');

      toast({
        title: "GP51 Integration Complete",
        description: `Successfully connected to GP51 as ${credentials.username}`,
      });

      setCredentials({ username: '', password: '' });
      navigate('/dashboard');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'GP51 setup failed';
      setError(errorMessage);
      
      toast({
        title: "GP51 Setup Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            {isAdmin ? (
              <Crown className="h-8 w-8 text-blue-600" />
            ) : (
              <Shield className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isAdmin ? 'Admin GP51 Access' : 'GP51 Integration Setup'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isAdmin 
              ? 'Administrative access to GP51 platform' 
              : 'Connect your GP51 account to access vehicle tracking data'
            }
          </p>
        </div>

        {/* Admin Auto-Auth Status */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Admin Auto-Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adminAutoAuth.isAutoAuthenticating && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Setting up admin access...</p>
                </div>
              )}
              
              {adminAutoAuth.autoAuthCompleted && (
                <div className="text-center py-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-800">Admin access configured successfully!</p>
                  <Button onClick={() => navigate('/dashboard')} className="mt-2">
                    Go to Dashboard
                  </Button>
                </div>
              )}
              
              {adminAutoAuth.error && (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Auto-authentication failed. You can retry or use manual setup below.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={handleRetryAdminAuth} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      'Retry Auto-Authentication'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manual Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {isAdmin ? 'Manual GP51 Setup' : 'GP51 Credentials'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Why GP51 Integration */}
            {!isAdmin && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">Why is this required?</div>
                    <div className="text-sm text-blue-800 mt-1">
                      GP51 integration provides access to real-time vehicle tracking, 
                      location history, and fleet management data essential for the dashboard.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Setup Form */}
            <form onSubmit={handleGP51Setup} className="space-y-4">
              <div>
                <Label htmlFor="username">GP51 Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={handleInputChange('username')}
                  placeholder="Enter your GP51 username"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">GP51 Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={handleInputChange('password')}
                  placeholder="Enter your GP51 password"
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !credentials.username.trim() || !credentials.password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting to GP51...
                  </>
                ) : (
                  'Complete GP51 Setup'
                )}
              </Button>
            </form>

            {/* Security Note */}
            <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
              <div className="text-xs text-gray-600">
                <strong>Security Note:</strong> Your GP51 credentials are securely encrypted 
                and stored in our database. We use industry-standard security practices 
                to protect your information.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GP51Setup;
