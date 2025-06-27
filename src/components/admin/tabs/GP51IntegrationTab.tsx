
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertCircle, Loader2, Key, TestTube, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GP51IntegrationTab: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingMD5, setIsTestingMD5] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [md5TestResults, setMd5TestResults] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-connection-check');
      
      if (!error && data?.success && data?.connected) {
        setConnectionStatus('connected');
        setLastError(null);
      } else {
        setConnectionStatus('disconnected');
        setLastError(data?.error || 'Not connected');
      }
    } catch (error) {
      setConnectionStatus('error');
      setLastError('Connection check failed');
    }
  };

  const testMD5Implementation = async () => {
    setIsTestingMD5(true);
    try {
      const { data, error } = await supabase.functions.invoke('gp51-password-verify', {
        body: { testPassword: credentials.password }
      });

      if (error) {
        throw new Error(error.message);
      }

      setMd5TestResults(data);
      
      if (data.allTestsPassed) {
        toast({
          title: "MD5 Test Successful",
          description: "MD5 implementation is working correctly",
        });
      } else {
        toast({
          title: "MD5 Test Failed",
          description: "MD5 implementation has issues",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('MD5 test error:', error);
      toast({
        title: "MD5 Test Error",
        description: error instanceof Error ? error.message : 'Failed to test MD5',
        variant: "destructive",
      });
    } finally {
      setIsTestingMD5(false);
    }
  };

  const authenticateWithGP51 = async () => {
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLastError(null);

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
        setConnectionStatus('connected');
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${data.username}`,
        });
        await checkConnectionStatus();
      } else {
        setConnectionStatus('error');
        setLastError(data.error || 'Authentication failed');
        toast({
          title: "Authentication Failed",
          description: data.error || 'Invalid credentials',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('GP51 authentication error:', error);
      setConnectionStatus('error');
      setLastError(error instanceof Error ? error.message : 'Authentication failed');
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : 'Failed to authenticate',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GP51 Integration</h2>
          <p className="text-muted-foreground">Configure GP51 fleet tracking integration</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
      </div>

      <Tabs defaultValue="authentication" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="testing">MD5 Testing</TabsTrigger>
          <TabsTrigger value="status">Connection Status</TabsTrigger>
        </TabsList>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                GP51 Credentials
              </CardTitle>
              <CardDescription>
                Enter your GP51 username and password to authenticate with the API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter GP51 username"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter GP51 password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                onClick={authenticateWithGP51}
                disabled={isLoading || !credentials.username || !credentials.password}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Authenticate with GP51
                  </>
                )}
              </Button>

              {lastError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{lastError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                MD5 Hash Testing
              </CardTitle>
              <CardDescription>
                Test the MD5 implementation to ensure it matches GP51's expectations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testMD5Implementation}
                disabled={isTestingMD5}
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

              {md5TestResults && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">MD5 Test Results</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>MD5 Available:</div>
                      <div>{md5TestResults.md5Available ? '✅ Yes' : '❌ No'}</div>
                      <div>All Tests Passed:</div>
                      <div>{md5TestResults.allTestsPassed ? '✅ Yes' : '❌ No'}</div>
                    </div>
                  </div>

                  {md5TestResults.yourPasswordHash && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Your Password Hash</h4>
                      <code className="block p-2 bg-muted rounded text-sm break-all">
                        {md5TestResults.yourPasswordHash}
                      </code>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium">Test Cases</h4>
                    <div className="space-y-1">
                      {md5TestResults.md5Tests?.map((test: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className={test.matches ? 'text-green-600' : 'text-red-600'}>
                            {test.matches ? '✅' : '❌'}
                          </span>
                          <span>"{test.input}" → {test.computed}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Connection Status
              </CardTitle>
              <CardDescription>
                Current GP51 integration status and diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Connection Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  {getStatusBadge()}
                </div>
              </div>

              {lastError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{lastError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={checkConnectionStatus}
                variant="outline"
                className="w-full"
              >
                <Wifi className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51IntegrationTab;
