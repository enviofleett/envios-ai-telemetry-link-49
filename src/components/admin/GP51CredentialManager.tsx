
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Save, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GP51CredentialManager: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    apiUrl: 'https://www.gps51.com/webapi'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load existing credentials on mount
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      // Try to get stored credentials from user profile or a secure table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('gp51_username, gp51_api_url')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setCredentials(prev => ({
            ...prev,
            username: data.gp51_username || '',
            apiUrl: data.gp51_api_url || 'https://www.gps51.com/webapi'
          }));
        }
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCredentials = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Test credentials first
      const { data: testResult, error: testError } = await supabase.functions.invoke('gp51-secure-auth', {
        body: credentials
      });

      if (testError || !testResult?.success) {
        throw new Error(`Invalid credentials: ${testResult?.error || testError?.message}`);
      }

      // Save credentials to user settings (username and API URL only - never store passwords)
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          gp51_username: credentials.username,
          gp51_api_url: credentials.apiUrl,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Credentials Saved",
        description: "GP51 credentials have been validated and saved successfully.",
      });

      // Clear password from state for security
      setCredentials(prev => ({ ...prev, password: '' }));

    } catch (error) {
      console.error('Error saving credentials:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Failed to save credentials',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: credentials
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Connection test failed');
      }

      toast({
        title: "Connection Successful",
        description: `Connected to GP51 as ${credentials.username}`,
      });

    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Connection test failed',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          GP51 Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter GP51 username"
            value={credentials.username}
            onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
            disabled={isLoading || isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter GP51 password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              disabled={isLoading || isSaving}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiUrl">API URL</Label>
          <Input
            id="apiUrl"
            type="url"
            placeholder="GP51 API URL"
            value={credentials.apiUrl}
            onChange={(e) => setCredentials(prev => ({ ...prev, apiUrl: e.target.value }))}
            disabled={isLoading || isSaving}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={testConnection}
            disabled={isLoading || isSaving || !credentials.username || !credentials.password}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>
          
          <Button
            onClick={saveCredentials}
            disabled={isLoading || isSaving || !credentials.username || !credentials.password}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save & Test'}
          </Button>
        </div>

        <div className="text-xs text-gray-600 mt-4 p-2 bg-gray-50 rounded">
          <strong>Security Note:</strong> Passwords are never stored. Only username and API URL are saved to your profile.
          You'll need to re-enter your password each session.
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51CredentialManager;
