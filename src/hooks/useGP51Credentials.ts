
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gp51StatusCoordinator } from '@/services/gp51/statusCoordinator';

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
      
      // Notify status coordinator that save is starting
      gp51StatusCoordinator.startSaveOperation();
      
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
        
        // Check for HTTP-level errors first
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
          
          // Check if it's a network/connection error
          if (error.message?.includes('network') || error.message?.includes('fetch')) {
            throw new Error('Network connection failed. Please check your internet connection and try again.');
          }
          
          throw new Error(error.message || 'Edge function call failed');
        }
        
        // Check the response success flag - this is the critical fix
        if (!data || data.success === false) {
          console.error('❌ GP51 save operation failed:', data);
          
          // Extract meaningful error information
          const errorMessage = data?.details || data?.error || 'Failed to save GP51 credentials';
          const errorCode = data?.code || 'UNKNOWN_ERROR';
          
          // Provide specific error messages based on error codes
          if (errorCode === 'GP51_AUTH_FAILED') {
            throw new Error('GP51 authentication failed: Invalid username or password');
          } else if (errorCode === 'GP51_AUTH_EXCEPTION') {
            throw new Error('GP51 service error: Unable to connect to GP51 servers');
          } else if (errorCode === 'DB_CONNECTION_FAILED' || errorCode === 'DB_SAVE_FAILED' || errorCode === 'SESSION_CREATION_FAILED') {
            throw new Error('Database error: Unable to save credentials. Please try again.');
          } else if (errorCode === 'AUTH_REQUIRED' || errorCode === 'AUTH_INVALID') {
            throw new Error('Authentication required: Please refresh the page and log in again');
          }
          
          throw new Error(errorMessage);
        }
        
        console.log('✅ GP51 credentials saved successfully:', data);
        return data;
        
      } catch (fetchError) {
        console.error('❌ Request failed:', fetchError);
        
        // Re-throw with better error context if it's our own error
        if (fetchError instanceof Error && fetchError.message.includes('GP51')) {
          throw fetchError;
        }
        
        // For unexpected errors, provide a generic message
        throw new Error('Connection failed: Unable to save GP51 credentials. Please try again.');
      }
    },
    onSuccess: (data) => {
      console.log('🎉 GP51 credentials save mutation succeeded');
      
      // Notify status coordinator of successful save
      const responseData = data as { message?: string; success?: boolean; testOnly?: boolean; username?: string; sessionVerified?: boolean };
      gp51StatusCoordinator.reportSaveSuccess(responseData?.username);
      
      // Clear form fields
      setUsername('');
      setPassword('');
      setApiUrl('');
      
      // Show success toast
      const message = responseData?.testOnly 
        ? 'GP51 connection test successful!' 
        : responseData?.message || 'Successfully connected to GP51! Session will be used for vehicle data synchronization.';
        
      // Add session verification confirmation to success message
      const successMessage = responseData?.sessionVerified 
        ? `${message} Session verified and saved to database.`
        : message;
        
      toast({ 
        title: responseData?.testOnly ? 'Connection Test Successful' : 'GP51 Credentials Saved',
        description: successMessage
      });

      // Invalidate queries after a delay to prevent conflicts
      if (!responseData?.testOnly) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
        }, 2000); // 2 second delay
      }
    },
    onError: (error: unknown) => {
      console.error('❌ GP51 credentials save mutation failed:', error);
      
      // Properly handle the error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Notify status coordinator of save error
      gp51StatusCoordinator.reportSaveError(errorMessage);
      
      // Categorize the error for better user feedback
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
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('Connection failed')) {
        errorTitle = 'Network Error';
        errorDescription = 'Unable to connect to GP51 API. Please check your internet connection and try again.';
      } else if (errorMessage.includes('Database error')) {
        errorTitle = 'Database Error';
        errorDescription = 'Unable to save credentials to database. Please try again in a few moments.';
      } else if (errorMessage.includes('GP51 service error')) {
        errorTitle = 'GP51 Service Error';
        errorDescription = 'GP51 servers are currently unavailable. Please try again later.';
      } else {
        // Use the specific error message if available
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
