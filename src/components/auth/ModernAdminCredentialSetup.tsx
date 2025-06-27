
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Key, CheckCircle, XCircle, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModernAdminCredentialSetupProps {
  onCredentialsStored: () => void;
  onBackToLogin: () => void;
}

const ModernAdminCredentialSetup: React.FC<ModernAdminCredentialSetupProps> = ({
  onCredentialsStored,
  onBackToLogin
}) => {
  const [credentials, setCredentials] = useState({
    username: 'octopus',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingMD5, setIsTestingMD5] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [md5TestPassed, setMd5TestPassed] = useState<boolean | null>(null);
  const { toast } = useToast();

  const testMD5Implementation = async () => {
    if (!credentials.password) {
      toast({
        title: "Password Required",
        description: "Please enter a password to test MD5 implementation",
        variant: "destructive",
      });
      return;
    }

    setIsTestingMD5(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('gp51-password-verify', {
        body: { testPassword: credentials.password }
      });

      if (error) {
        throw new Error(error.message);
      }

      setMd5TestPassed(data.allTestsPassed);
      
      if (data.allTestsPassed) {
        toast({
          title: "MD5 Test Successful",
          description: "MD5 implementation is working correctly",
        });
      } else {
        toast({
          title: "MD5 Test Failed",
          description: "MD5 implementation has issues - check logs",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('MD5 test error:', error);
      setError(error instanceof Error ? error.message : 'MD5 test failed');
      setMd5TestPassed(false);
    } finally {
      setIsTestingMD5(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          username: credentials.username,
          password: credentials.password
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Setup Successful",
          description: `GP51 credentials stored and authenticated as ${data.username}`,
        });
        onCredentialsStored();
      } else {
        setError(data.error || 'Authentication failed');
        toast({
          title: "Setup Failed",
          description: data.error || 'Failed to authenticate with GP51',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Credential setup error:', error);
      setError(error instanceof Error ? error.message : 'Setup failed');
      toast({
        title: "Setup Error",
        description: error instanceof Error ? error.message : 'Failed to set up credentials',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Key className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>GP51 Setup</CardTitle>
        <CardDescription>
          Configure your GP51 credentials with real MD5 authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">GP51 Username</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter GP51 username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">GP51 Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter GP51 password"
              required
            />
          </div>

          {/* MD5 Test Section */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={testMD5Implementation}
              disabled={isTestingMD5 || !credentials.password}
              variant="outline"
              className="w-full"
            >
              {isTestingMD5 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing MD5...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test MD5 Implementation
                </>
              )}
            </Button>

            {md5TestPassed !== null && (
              <div className={`flex items-center gap-2 text-sm ${md5TestPassed ? 'text-green-600' : 'text-red-600'}`}>
                {md5TestPassed ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    MD5 implementation working correctly
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    MD5 implementation has issues
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Setup GP51 Credentials'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onBackToLogin}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ModernAdminCredentialSetup;
