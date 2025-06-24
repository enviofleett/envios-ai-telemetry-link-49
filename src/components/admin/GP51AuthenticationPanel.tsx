
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGP51SessionRestoration } from '@/hooks/useGP51SessionRestoration';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, Trash2, Activity } from 'lucide-react';

const GP51AuthenticationPanel: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    apiUrl: 'https://www.gps51.com'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { sessionInfo, refreshSession, runHealthCheck, cleanupSessions } = useGP51SessionRestoration();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAuthenticate = async () => {
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔑 [AUTH-PANEL] Starting GP51 authentication...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: credentials.username,
          password: credentials.password,
          apiUrl: credentials.apiUrl
        }
      });

      if (error) {
        console.error('❌ [AUTH-PANEL] Authentication error:', error);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.success) {
        console.log('✅ [AUTH-PANEL] Authentication successful');
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${credentials.username}`,
        });
        
        // Clear form and refresh session
        setCredentials({
          username: '',
          password: '',
          apiUrl: 'https://www.gps51.com'
        });
        await refreshSession();
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('❌ [AUTH-PANEL] Authentication failed:', error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (sessionInfo.isLoading) {
      return (
        <Badge variant="secondary">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Checking...
        </Badge>
      );
    }

    if (sessionInfo.isValid) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    }

    const warningLevel = sessionInfo.warningLevel || 'error';
    if (warningLevel === 'warning') {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Disconnected
      </Badge>
    );
  };

  const getStatusMessage = () => {
    if (sessionInfo.isLoading) return "Checking GP51 connection status...";
    if (sessionInfo.isValid && sessionInfo.username) {
      const expiryText = sessionInfo.expiresAt 
        ? ` (expires ${sessionInfo.expiresAt.toLocaleString()})`
        : '';
      return `Connected as ${sessionInfo.username}${expiryText}`;
    }
    return sessionInfo.error || "Not connected to GP51";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>GP51 Authentication</CardTitle>
            </div>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Configure your GP51 credentials for secure access to the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Information */}
          <Alert className={sessionInfo.warningLevel === 'error' ? 'border-red-200 bg-red-50' : 
                           sessionInfo.warningLevel === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                           'border-green-200 bg-green-50'}>
            <AlertDescription>
              {getStatusMessage()}
            </AlertDescription>
          </Alert>

          {/* Debug Information */}
          {sessionInfo.statusDetails && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <strong>Debug Info:</strong> 
              Active: {sessionInfo.statusDetails.sessionActive ? 'Yes' : 'No'}, 
              Valid: {sessionInfo.statusDetails.validationPassed ? 'Yes' : 'No'}
              {sessionInfo.statusDetails.timeToExpiry && 
                `, Expires in: ${Math.round(sessionInfo.statusDetails.timeToExpiry / (1000 * 60))} minutes`
              }
            </div>
          )}

          {/* Action Buttons for existing sessions */}
          {(sessionInfo.isValid || sessionInfo.error) && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSession}
                disabled={sessionInfo.isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={runHealthCheck}
                disabled={sessionInfo.isLoading}
              >
                <Activity className="h-4 w-4 mr-1" />
                Health Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cleanupSessions}
                disabled={sessionInfo.isLoading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Sessions
              </Button>
            </div>
          )}

          {/* Authentication Form */}
          {(!sessionInfo.isValid || sessionInfo.requiresAuth) && (
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="username">GP51 Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={credentials.username}
                  onChange={handleInputChange}
                  placeholder="Enter your GP51 username"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">GP51 Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  placeholder="Enter your GP51 password"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API Base URL</Label>
                <Input
                  id="apiUrl"
                  name="apiUrl"
                  type="text"
                  value={credentials.apiUrl}
                  onChange={handleInputChange}
                  placeholder="GP51 API Base URL"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Base URL for GP51 API (default: https://www.gps51.com)
                </p>
              </div>
              
              <Button 
                onClick={handleAuthenticate} 
                disabled={isLoading || !credentials.username || !credentials.password}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Authenticate with GP51
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51AuthenticationPanel;
