
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionHealthMonitor } from '@/services/gp51/sessionHealthMonitor';

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
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to save GP51 credentials');
      }

      // Get user from envio_users table
      const { data: envioUser, error: envioUserError } = await supabase
        .from('envio_users')
        .select('id, email')
        .eq('email', user.email)
        .single();

      if (envioUserError || !envioUser) {
        throw new Error('User profile not found. Please contact support.');
      }

      const payload: any = { 
        action: 'save-gp51-credentials',
        username,
        password,
        userId: envioUser.id // Include user ID for proper linking
      };

      if (apiUrl && apiUrl.trim()) {
        payload.apiUrl = apiUrl.trim();
      }

      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: payload
      });
      
      if (error) throw error;
      
      // Validate that the save was actually successful
      if (!data.success) {
        throw new Error(data.error || 'Failed to save GP51 credentials');
      }
      
      return { ...data, userId: envioUser.id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
      setUsername('');
      setPassword('');
      setApiUrl('');
      
      toast({ 
        title: 'GP51 Credentials Saved',
        description: data.message || `Successfully connected to GP51 and linked to your account! Session will be used for vehicle data synchronization.`
      });

      // Force session health check and clear any cached data
      setTimeout(async () => {
        sessionHealthMonitor.clearCache?.();
        await sessionHealthMonitor.forceHealthCheck();
      }, 1000);
    },
    onError: (error: any) => {
      console.error('GP51 credentials save error:', error);
      
      // Clear any potentially stale cached data
      sessionHealthMonitor.clearCache?.();
      
      toast({ 
        title: 'Connection Failed', 
        description: error.message || 'Failed to connect to GP51. Please check your credentials and try again.',
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
