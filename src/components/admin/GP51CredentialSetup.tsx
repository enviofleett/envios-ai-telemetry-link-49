
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Save, TestTube } from 'lucide-react';

const GP51CredentialSetup: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isStoring, setIsStoring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const storeCredentials = async () => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter the GP51 password",
        variant: "destructive"
      });
      return;
    }

    setIsStoring(true);
    try {
      // First, store credentials directly in gp51_sessions
      const { data: adminUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', 'chudesyl@gmail.com')
        .single();

      if (!adminUser) {
        throw new Error('Admin user not found');
      }

      // Clear existing sessions
      await supabase
        .from('gp51_sessions')
        .delete()
        .eq('envio_user_id', adminUser.id);

      // Insert new session
      const { error } = await supabase
        .from('gp51_sessions')
        .insert({
          envio_user_id: adminUser.id,
          username: 'octopus',
          password_hash: password,
          gp51_token: 'pending_authentication',
          token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          api_url: 'https://www.gps51.com/webapi',
          auth_method: 'MANUAL_SETUP'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "GP51 credentials stored successfully"
      });

      setPassword('');
    } catch (error) {
      console.error('Error storing credentials:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to store credentials",
        variant: "destructive"
      });
    } finally {
      setIsStoring(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gp51-connection-check');
      
      if (error) throw error;

      if (data.success) {
        toast({
          title: "Connection Test Successful",
          description: `Connected to GP51 for user: ${data.username}`
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: data.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast({
        title: "Connection Test Error",
        description: error instanceof Error ? error.message : "Test failed",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          GP51 Credential Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Store GP51 credentials for the octopus account to enable vehicle import functionality.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value="octopus"
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter GP51 password for octopus account"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={storeCredentials}
            disabled={isStoring || !password.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isStoring ? 'Storing...' : 'Store Credentials'}
          </Button>

          <Button
            variant="outline"
            onClick={testConnection}
            disabled={isTesting}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51CredentialSetup;
