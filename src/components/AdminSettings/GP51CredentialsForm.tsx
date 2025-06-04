
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const GP51CredentialsForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveCredentialsMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { 
          action: 'save-gp51-credentials',
          username,
          password
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
      setUsername('');
      setPassword('');
      toast({ 
        title: 'GP51 Credentials Saved',
        description: data.message || 'Successfully connected to GP51! These credentials will be used for automated imports.'
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Connection Failed', 
        description: error.message || 'Failed to connect to GP51',
        variant: 'destructive' 
      });
    },
  });

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both username and password',
        variant: 'destructive'
      });
      return;
    }
    saveCredentialsMutation.mutate({ username, password });
  };

  return (
    <>
      <form onSubmit={handleSaveCredentials} className="space-y-4">
        <div>
          <Label htmlFor="gp51-username">GP51 Username</Label>
          <Input
            id="gp51-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your GP51 username"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="gp51-password">GP51 Password</Label>
          <Input
            id="gp51-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your GP51 password"
            required
          />
        </div>

        <Button 
          type="submit" 
          disabled={saveCredentialsMutation.isPending}
          className="w-full"
        >
          {saveCredentialsMutation.isPending ? 'Connecting...' : 'Save & Connect'}
        </Button>
      </form>

      <Alert>
        <AlertDescription className="text-sm">
          <strong>Automated Import Integration:</strong> These credentials will be securely stored and used 
          for automated passwordless imports. Once connected, the system can import GP51 user and vehicle 
          data without requiring manual password input for each import operation.
        </AlertDescription>
      </Alert>
    </>
  );
};

export default GP51CredentialsForm;
