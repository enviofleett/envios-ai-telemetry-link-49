
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useGP51Credentials = () => {
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

  const handleSaveCredentials = () => {
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

  return {
    username,
    setUsername,
    password,
    setPassword,
    handleSaveCredentials,
    isLoading: saveCredentialsMutation.isPending
  };
};
