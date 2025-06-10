
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionHealthMonitor } from '@/services/gp51/sessionHealthMonitor';

export const useGP51Credentials = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveCredentialsMutation = useMutation({
    mutationFn: async ({ 
      username, 
      password, 
      apiUrl,
      retryCount = 0 
    }: { 
      username: string; 
      password: string; 
      apiUrl?: string;
      retryCount?: number;
    }) => {
      console.log('🔐 Starting GP51 credentials save mutation...');
      setIsSaving(true);
      
      // Check authentication state first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ No valid authentication session:', sessionError);
        throw new Error('You must be logged in to save GP51 credentials. Please refresh the page and try again.');
      }

      console.log('✅ Valid session found, proceeding with request...');

      const payload: any = { 
        action: 'save-gp51-credentials',
        username,
        password
      };

      if (apiUrl && apiUrl.trim()) {
        payload.apiUrl = apiUrl.trim();
      }

      console.log('📡 Calling settings-management function with payload...');
      
      try {
        const { data, error } = await supabase.functions.invoke('settings-management', {
          body: payload
        });
        
        if (error) {
          console.error('❌ Edge function invocation failed:', error);
          
          // If it's a 401 error and we haven't retried yet, try once more
          if (error.message?.includes('401') && retryCount < 1) {
            console.log('🔄 Retrying due to authentication error...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return await saveCredentialsMutation.mutateAsync({ 
              username, 
              password, 
              apiUrl, 
              retryCount: retryCount + 1 
            });
          }
          
          throw error;
        }
        
        // Validate that the save was actually successful
        if (!data || !data.success) {
          console.error('❌ GP51 save operation failed:', data);
          throw new Error(data?.error || data?.details || 'Failed to save GP51 credentials');
        }
        
        console.log('✅ GP51 credentials saved successfully:', data);
        return data;
        
      } catch (fetchError) {
        console.error('❌ Request failed:', fetchError);
        throw fetchError;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 GP51 credentials save mutation succeeded');
      
      // Clear form fields
      setUsername('');
      setPassword('');
      setApiUrl('');
      
      // Show success toast
      const responseData = data as { message?: string; success?: boolean };
      toast({ 
        title: 'GP51 Credentials Saved',
        description: responseData?.message || `Successfully connected to GP51! Session will be used for vehicle data synchronization.`
      });

      // Invalidate queries and force health check after a delay to prevent conflicts
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
        sessionHealthMonitor.clearCache?.();
        sessionHealthMonitor.forceHealthCheck();
      }, 2000); // 2 second delay to prevent notification conflicts
    },
    onError: (error: unknown) => {
      console.error('❌ GP51 credentials save mutation failed:', error);
      
      // Clear any potentially stale cached data
      sessionHealthMonitor.clearCache?.();
      
      // Properly handle the error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Categorize the error
      let errorTitle = 'Connection Failed';
      let errorDescription = 'Failed to connect to GP51. Please check your credentials and try again.';
      
      if (errorMessage.includes('Authentication required') || errorMessage.includes('logged in')) {
        errorTitle = 'Authentication Required';
        errorDescription = 'Please refresh the page and ensure you are logged in before trying again.';
      } else if (errorMessage.includes('User profile not found')) {
        errorTitle = 'Profile Error';
        errorDescription = 'User profile not found. Please contact support.';
      } else if (errorMessage.includes('GP51 authentication failed')) {
        errorTitle = 'GP51 Authentication Failed';
        errorDescription = 'Invalid GP51 username or password. Please check your credentials.';
      } else if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
        errorTitle = 'Network Error';
        errorDescription = 'Unable to connect to GP51 API. Please check your internet connection and try again.';
      } else if (error && typeof error === 'object' && 'details' in error) {
        errorDescription = String((error as any).details);
      } else {
        errorDescription = errorMessage;
      }
      
      toast({ 
        title: errorTitle, 
        description: errorDescription,
        variant: 'destructive' 
      });
    },
    onSettled: () => {
      setIsSaving(false);
    }
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
    isLoading: saveCredentialsMutation.isPending || isSaving
  };
};
