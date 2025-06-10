import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGP51Credentials } from '@/hooks/useGP51Credentials';
import { useGP51SessionRestoration } from '@/hooks/useGP51SessionRestoration';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle, Settings, TestTube, Shield, Monitor, Clock } from 'lucide-react';
import { gp51StatusCoordinator, type GP51StatusState } from '@/services/gp51/statusCoordinator';
import { gp51ErrorReporter } from '@/services/gp51/errorReporter';
import { ValidationFeedback } from './ValidationFeedback';

interface GP51CredentialsFormProps {
  onConnectionChange?: (connected: boolean) => void;
}

export const GP51CredentialsForm: React.FC<GP51CredentialsFormProps> = ({
  onConnectionChange
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success?: boolean;
    message?: string;
    error?: any;
  } | null>(null);
  const [coordinatedStatus, setCoordinatedStatus] = useState<GP51StatusState | null>(null);
  
  const { toast } = useToast();
  
  // Use session restoration hook
  const { sessionInfo, refreshSession } = useGP51SessionRestoration();
  
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

  // Subscribe to coordinated status updates
  useEffect(() => {
    const unsubscribe = gp51StatusCoordinator.subscribeToStatus((status) => {
      setCoordinatedStatus(status);
      
      // Call connection change callback
      if (onConnectionChange) {
        onConnectionChange(status.isConnected);
      }
      
      // Show errors only when appropriate using the shouldShowError method
      if (gp51StatusCoordinator.shouldShowError() && status.errorMessage && status.errorSource === 'monitor') {
        // Only show monitor errors as non-intrusive warnings, not toast notifications
        console.warn('🔍 Monitor detected connection issue:', status.errorMessage);
      }
    });

    return unsubscribe;
  }, [onConnectionChange]);

  // Handle session restoration results
  useEffect(() => {
    if (!sessionInfo.isLoading) {
      if (sessionInfo.isValid && sessionInfo.username) {
        // Session restored successfully
        gp51StatusCoordinator.restoreFromSession(sessionInfo.username, sessionInfo.expiresAt!);
      } else {
        // No valid session found or error occurred
        gp51StatusCoordinator.finishLoading();
      }
    }
  }, [sessionInfo]);

  const handleTestConnection = async () => {
    if (!username || !password) {
      setValidationResult({
        error: {
          code: 'GP51_VALIDATION_ERROR',
          message: 'Missing Information',
          details: 'Please provide both username and password to test the connection',
          suggestions: [
            'Enter your GP51 username',
            'Enter your GP51 password',
            'Verify credentials are correct'
          ],
          category: 'validation',
          severity: 'medium'
        }
      });
      return;
    }

    setIsTestingConnection(true);
    setValidationResult(null);
    
    try {
      console.log('🧪 Starting real GP51 connection test...');
      
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
      
      if (data.success) {
        console.log('✅ GP51 connection test successful');
        setValidationResult({
          success: true,
          message: 'GP51 API connection test successful! Ready to save credentials.'
        });
        
        toast({
          title: "Connection Test Successful",
          description: "GP51 API connection is working properly",
        });
      } else {
        console.error('❌ GP51 connection test failed:', data);
        setValidationResult({
          error: data // Backend now returns detailed error information
        });
        
        toast({
          title: "Connection Test Failed",
          description: data.details || "Failed to connect to GP51 API",
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
      
      setValidationResult({
        error: {
          code: 'GP51_TEST_ERROR',
          message: 'Connection test error',
          details: error instanceof Error ? error.message : 'An unexpected error occurred during connection testing',
          suggestions: [
            'Check your internet connection',
            'Verify GP51 credentials',
            'Try again in a few moments',
            'Contact support if the issue persists'
          ],
          category: 'api',
          severity: 'high'
        }
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
      setValidationResult({
        error: {
          code: 'GP51_VALIDATION_ERROR',
          message: 'Missing Information',
          details: 'Please provide both username and password',
          suggestions: [
            'Enter your GP51 username',
            'Enter your GP51 password'
          ],
          category: 'validation',
          severity: 'medium'
        }
      });
      return;
    }

    try {
      console.log('💾 Saving GP51 credentials...');
      await handleSaveCredentials();
      
      setValidationResult({
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
      
      setValidationResult({
        error: {
          code: 'GP51_SAVE_ERROR',
          message: 'Failed to save credentials',
          details: error instanceof Error ? error.message : 'An unexpected error occurred while saving credentials',
          suggestions: [
            'Try the save operation again',
            'Check your internet connection',
            'Verify all credentials are correct',
            'Contact support if the issue persists'
          ],
          category: 'api',
          severity: 'high'
        }
      });
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (suggestion.includes('legacy URL') || suggestion.includes('https://www.gps51.com')) {
      setApiUrl('https://www.gps51.com');
      toast({
        title: "URL Updated",
        description: "Set to legacy GP51 URL. You can now test the connection.",
      });
    } else if (suggestion.includes('Try again') || suggestion.includes('retry')) {
      if (validationResult?.error?.category === 'api') {
        await handleTestConnection();
      } else {
        await handleFormSubmit();
      }
    }
  };

  const getConnectionStatusBadge = () => {
    // Show loading state during session restoration
    if (sessionInfo.isLoading || coordinatedStatus?.currentOperation === 'loading') {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Loading...
        </Badge>
      );
    }

    // Show saving state
    if (coordinatedStatus?.currentOperation === 'saving' || isLoading) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Saving...
        </Badge>
      );
    }

    // Show connected state (from restored session or recent save)
    if (coordinatedStatus?.isConnected || sessionInfo.isValid) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    } else if (coordinatedStatus?.errorSource === 'monitor') {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Monitor Warning
        </Badge>
      );
    } else if (coordinatedStatus?.errorMessage || sessionInfo.error) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Connection Issues
        </Badge>
      );
    } else if (validationResult?.success) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Test Successful
        </Badge>
      );
    } else if (validationResult?.error) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Test Failed
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

  const getDisplayUsername = () => {
    // Prioritize restored session username over form username
    return sessionInfo.username || coordinatedStatus?.username;
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
              Configure your GP51 tracking system credentials with session persistence
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getConnectionStatusBadge()}
            {getDisplayUsername() && (
              <Badge variant="outline" className="text-xs">
                <Monitor className="h-3 w-3 mr-1" />
                {getDisplayUsername()}
              </Badge>
            )}
            {sessionInfo.expiresAt && sessionInfo.isValid && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Expires {sessionInfo.expiresAt.toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show session restoration status */}
        {sessionInfo.isValid && sessionInfo.username && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✅ Session Restored:</strong> Connected as {sessionInfo.username}
            </p>
            {sessionInfo.expiresAt && (
              <p className="text-xs text-green-700 mt-1">
                Session expires: {sessionInfo.expiresAt.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Show session errors */}
        {sessionInfo.error && !sessionInfo.isValid && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Session Issue:</strong> {sessionInfo.error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshSession}
              className="mt-2"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Refresh Session
            </Button>
          </div>
        )}

        <ValidationFeedback
          error={validationResult?.error}
          success={validationResult?.success}
          successMessage={validationResult?.message}
          isLoading={isTestingConnection || isLoading}
          onRetry={() => {
            if (validationResult?.error?.category === 'api') {
              handleTestConnection();
            } else {
              handleFormSubmit();
            }
          }}
          onSuggestionClick={handleSuggestionClick}
        />

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">GP51 API URL</Label>
            <Input
              id="apiUrl"
              type="url"
              placeholder="https://www.gps51.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !username || !password || isLoading}
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

          {coordinatedStatus?.errorSource === 'monitor' && coordinatedStatus.errorMessage && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Background Monitor Warning:</strong> {coordinatedStatus.errorMessage}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                This is a background monitoring alert and may not affect current operations.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
