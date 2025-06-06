
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useGP51Credentials = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveCredentialsMutation = useMutation({
    mutationFn: async ({ 
      username, 
      password, 
      apiUrl 
    }: { 
      username: string; 
      password: string; 
      apiUrl?: string;
    }) => {
      const payload: any = { 
        action: 'save-gp51-credentials',
        username,
        password
      };

      if (apiUrl && apiUrl.trim()) {
        payload.apiUrl = apiUrl.trim();
      }

      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: payload
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
      setUsername('');
      setPassword('');
      setApiUrl('');
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
    saveCredentialsMutation.mutate({ username, password, apiUrl });
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    apiUrl,
    setApiUrl,
    handleSaveCredentials,
    isLoading: saveCredentialsMutation.isPending
  };
};
