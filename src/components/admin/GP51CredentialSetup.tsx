
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Save, TestTube } from 'lucide-react';
import { GP51_BASE_URL } from '@/services/gp51/urlHelpers';

interface GP51CredentialSetupProps {
  onCredentialsStored?: () => void;
  compact?: boolean;
}

const GP51CredentialSetup: React.FC<GP51CredentialSetupProps> = ({ 
  onCredentialsStored,
  compact = false 
}) => {
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

      // Insert new session with standardized API URL
      const { error } = await supabase
        .from('gp51_sessions')
        .insert({
          envio_user_id: adminUser.id,
          username: 'octopus',
          password_hash: password,
          gp51_token: 'pending_authentication',
          token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          api_url: GP51_BASE_URL,
          auth_method: 'MANUAL_SETUP'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "GP51 credentials stored successfully. You can now login with username 'octopus'."
      });

      setPassword('');
      
      // Callback for parent component
      if (onCredentialsStored) {
        onCredentialsStored();
      }
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

  const content = (
    <>
      <Alert>
        <AlertDescription>
          {compact 
            ? "Configure GP51 credentials for admin access. Use the octopus account credentials."
            : "Store GP51 credentials for the octopus account to enable vehicle import functionality."
          }
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
    </>
  );

  if (compact) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Key className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-800">GP51 Admin Setup</span>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          GP51 Credential Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {content}
      </CardContent>
    </Card>
  );
};

export default GP51CredentialSetup;
