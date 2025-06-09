
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
      console.log('🔐 Starting GP51 credentials save mutation...');
      
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ User authentication failed:', userError);
        throw new Error('You must be logged in to save GP51 credentials');
      }

      console.log('✅ User authenticated, fetching envio_user profile...');

      // Get user from envio_users table
      const { data: envioUser, error: envioUserError } = await supabase
        .from('envio_users')
        .select('id, email')
        .eq('email', user.email)
        .single();

      if (envioUserError || !envioUser) {
        console.error('❌ Envio user profile not found:', envioUserError);
        throw new Error('User profile not found. Please contact support.');
      }

      console.log('✅ Envio user found:', envioUser.id);

      const payload: any = { 
        action: 'save-gp51-credentials',
        username,
        password,
        userId: envioUser.id // Include user ID for proper linking
      };

      if (apiUrl && apiUrl.trim()) {
        payload.apiUrl = apiUrl.trim();
      }

      console.log('📡 Calling settings-management function with payload...');
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: payload
      });
      
      if (error) {
        console.error('❌ Edge function invocation failed:', error);
        throw error;
      }
      
      // Validate that the save was actually successful
      if (!data.success) {
        console.error('❌ GP51 save operation failed:', data);
        throw new Error(data.error || data.details || 'Failed to save GP51 credentials');
      }
      
      console.log('✅ GP51 credentials saved successfully:', data);
      return { ...data, userId: envioUser.id };
    },
    onSuccess: (data) => {
      console.log('🎉 GP51 credentials save mutation succeeded');
      
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
      console.error('❌ GP51 credentials save mutation failed:', error);
      
      // Clear any potentially stale cached data
      sessionHealthMonitor.clearCache?.();
      
      // Extract meaningful error message
      const errorMessage = error.message || error.details || 'Failed to connect to GP51. Please check your credentials and try again.';
      
      toast({ 
        title: 'Connection Failed', 
        description: errorMessage,
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
    
    console.log('🚀 Initiating GP51 credentials save...');
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
