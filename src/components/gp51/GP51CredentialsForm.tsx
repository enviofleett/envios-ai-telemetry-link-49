import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGP51Credentials } from '@/hooks/useGP51Credentials';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle, Settings, TestTube, Shield } from 'lucide-react';
import { gp51SessionManager } from '@/services/gp51/sessionManager';
import { gp51ErrorReporter } from '@/services/gp51/errorReporter';

interface GP51CredentialsFormProps {
  onConnectionChange?: (connected: boolean) => void;
}

export const GP51CredentialsForm: React.FC<GP51CredentialsFormProps> = ({
  onConnectionChange
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  const { toast } = useToast();
  
  const {
    username,
    setUsername,
    password,
    setPassword,
    apiUrl,
    setApiUrl,
    handleSaveCredentials,
    isLoading
  } = useGP51Credentials();

  const handleTestConnection = async () => {
    if (!username || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both username and password to test the connection',
        variant: 'destructive'
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      console.log('🧪 Starting real GP51 connection test...');
      
      // Real connection test via backend with test-only mode
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { 
          action: 'save-gp51-credentials',
          username: username.trim(),
          password: password.trim(),
          apiUrl: apiUrl?.trim() || undefined,
          testOnly: true
        }
      });
      
      if (error) {
        console.error('❌ Connection test failed:', error);
        gp51ErrorReporter.reportError({
          type: 'connectivity',
          message: 'GP51 connection test failed',
          details: error,
          severity: 'high',
          username: username.trim()
        });
        throw error;
      }
      
      const success = data.success || false;
      
      setTestResult({
        success,
        message: success 
          ? 'GP51 API connection test successful! Ready to save credentials.' 
          : data.error || 'Connection test failed. Please verify your credentials and API URL.'
      });
      
      if (success) {
        console.log('✅ GP51 connection test successful');
        toast({
          title: "Connection Test Successful",
          description: "GP51 API connection is working properly",
        });
      } else {
        console.error('❌ GP51 connection test failed:', data.error);
        gp51ErrorReporter.reportError({
          type: 'authentication',
          message: 'GP51 authentication failed during test',
          details: data,
          severity: 'medium',
          username: username.trim()
        });
        
        toast({
          title: "Connection Test Failed",
          description: data.error || "Failed to connect to GP51 API. Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Connection test exception:', error);
      
      gp51ErrorReporter.reportError({
        type: 'api',
        message: 'Connection test API call failed',
        details: error,
        severity: 'high',
        username: username.trim()
      });
      
      setTestResult({
        success: false,
        message: 'Connection test error: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
      
      toast({
        title: "Connection Test Error",
        description: "An error occurred while testing the connection",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!username || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both username and password',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('💾 Saving GP51 credentials...');
      await handleSaveCredentials();
      
      // Clear session cache to force fresh validation
      gp51SessionManager.clearCache();
      
      onConnectionChange?.(true);
      setTestResult({
        success: true,
        message: 'GP51 credentials saved successfully and connection established!'
      });
      
      console.log('✅ GP51 credentials saved successfully');
    } catch (error) {
      console.error('❌ Failed to save credentials:', error);
      
      gp51ErrorReporter.reportError({
        type: 'api',
        message: 'Failed to save GP51 credentials',
        details: error,
        severity: 'high',
        username: username.trim()
      });
      
      setTestResult({
        success: false,
        message: 'Failed to save credentials: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  };

  const getConnectionStatusBadge = () => {
    if (testResult?.success) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    } else if (testResult?.success === false) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Connection Failed
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <Settings className="h-3 w-3 mr-1" />
          Not Tested
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              GP51 API Credentials
            </CardTitle>
            <CardDescription>
              Configure your GP51 tracking system credentials with secure backend storage
            </CardDescription>
          </div>
          {getConnectionStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">GP51 API URL</Label>
            <Input
              id="apiUrl"
              type="url"
              placeholder="https://www.gps51.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Default: https://www.gps51.com (leave empty for default)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">GP51 Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your GP51 username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !username || !password}
              variant="outline"
              className="flex-1"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  🧪 Test Connection
                </>
              )}
            </Button>

            <Button
              onClick={handleFormSubmit}
              disabled={isLoading || !username || !password}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Save & Connect
                </>
              )}
            </Button>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your GP51 credentials are encrypted and stored securely. The system will automatically 
              manage sessions and handle authentication for vehicle data synchronization.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};
