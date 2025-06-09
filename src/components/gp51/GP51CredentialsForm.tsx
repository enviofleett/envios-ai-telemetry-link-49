
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { gp51ApiService } from '@/services/gp51/gp51ApiService';
import { Loader2, CheckCircle, AlertCircle, Settings } from 'lucide-react';

interface GP51CredentialsFormProps {
  onConnectionChange?: (connected: boolean) => void;
}

export const GP51CredentialsForm: React.FC<GP51CredentialsFormProps> = ({
  onConnectionChange
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState('https://www.gps51.com');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    username?: string;
    error?: string;
  }>({ connected: false });
  
  const { toast } = useToast();

  const handleTestConnection = async () => {
    if (!username || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both username and password',
        variant: 'destructive'
      });
      return;
    }

    setIsTestingConnection(true);
    
    try {
      const result = await gp51ApiService.authenticate(username, password);
      
      if (result.success) {
        setConnectionStatus({ connected: true, username });
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to GP51 API'
        });
      } else {
        setConnectionStatus({ connected: false, error: result.error });
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to connect to GP51',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setConnectionStatus({ 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      toast({
        title: 'Connection Error',
        description: 'An error occurred while testing the connection',
        variant: 'destructive'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!username || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both username and password',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // First test the connection
      const authResult = await gp51ApiService.authenticate(username, password);
      
      if (!authResult.success) {
        toast({
          title: 'Authentication Failed',
          description: authResult.error || 'Invalid credentials',
          variant: 'destructive'
        });
        return;
      }

      // Save to database
      const saveResult = await gp51ApiService.saveCredentialsToDatabase({
        username,
        password,
        apiUrl
      });

      if (saveResult.success) {
        setConnectionStatus({ connected: true, username });
        onConnectionChange?.(true);
        
        // Clear form
        setUsername('');
        setPassword('');
        
        toast({
          title: 'Credentials Saved',
          description: 'GP51 credentials have been saved successfully'
        });
      } else {
        toast({
          title: 'Save Failed',
          description: saveResult.error || 'Failed to save credentials',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while saving credentials',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatusBadge = () => {
    if (connectionStatus.connected) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    } else if (connectionStatus.error) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Disconnected
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <Settings className="h-3 w-3 mr-1" />
          Not Configured
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>GP51 API Configuration</CardTitle>
            <CardDescription>
              Configure your GP51 tracking system credentials
            </CardDescription>
          </div>
          {getConnectionStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionStatus.connected && connectionStatus.username && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Connected as: <strong>{connectionStatus.username}</strong>
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {connectionStatus.error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <Input
              id="apiUrl"
              type="url"
              placeholder="https://www.gps51.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your GP51 username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your GP51 password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !username || !password}
              variant="outline"
              className="flex-1"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            <Button
              onClick={handleSaveCredentials}
              disabled={isLoading || !username || !password}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Credentials'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
