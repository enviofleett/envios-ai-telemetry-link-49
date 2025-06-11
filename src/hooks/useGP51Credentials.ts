
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
      
      // Enhanced authentication state checking with detailed logging
      console.log('🔍 Checking authentication state...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('📊 Session analysis:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length,
        sessionError: sessionError?.message,
        userEmail: session?.user?.email,
        tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
      });
      
      if (sessionError || !session || !session.access_token) {
        console.error('❌ Authentication session validation failed:', {
          sessionError: sessionError?.message,
          hasSession: !!session,
          hasAccessToken: !!session?.access_token
        });
        throw new Error('You must be logged in to save GP51 credentials. Please refresh the page and try again.');
      }

      // Verify token is not expired
      if (session.expires_at && session.expires_at < Date.now() / 1000) {
        console.error('❌ Access token is expired:', {
          expiresAt: new Date(session.expires_at * 1000).toISOString(),
          currentTime: new Date().toISOString()
        });
        throw new Error('Your session has expired. Please refresh the page and log in again.');
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

      console.log('📡 Calling settings-management function with enhanced payload:', {
        action: payload.action,
        hasUsername: !!payload.username,
        hasPassword: !!payload.password,
        hasApiUrl: !!payload.apiUrl,
        retryAttempt: retryCount
      });
      
      try {
        const { data, error } = await supabase.functions.invoke('settings-management', {
          body: payload
        });
        
        console.log('📡 Edge function response received:', {
          hasData: !!data,
          hasError: !!error,
          dataSuccess: data?.success,
          errorMessage: error?.message,
          dataCode: data?.code
        });
        
        // Enhanced HTTP-level error checking
        if (error) {
          console.error('❌ Edge function invocation failed:', {
            error: error.message,
            context: error.context,
            details: error.details
          });
          
          // Enhanced retry logic with specific error categorization
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
          
          // Enhanced error categorization for better user feedback
          if (error.message?.includes('network') || error.message?.includes('fetch')) {
            throw new Error('Network connection failed. Please check your internet connection and try again.');
          }
          
          if (error.message?.includes('timeout')) {
            throw new Error('Request timed out. Please try again.');
          }
          
          throw new Error(error.message || 'Edge function call failed');
        }
        
        // Enhanced response validation with detailed error reporting
        if (!data || data.success === false) {
          console.error('❌ GP51 save operation failed:', {
            data: data,
            success: data?.success,
            error: data?.error,
            code: data?.code,
            details: data?.details
          });
          
          // Enhanced error message categorization based on error codes
          const errorMessage = data?.details || data?.error || 'Failed to save GP51 credentials';
          const errorCode = data?.code || 'UNKNOWN_ERROR';
          
          // Provide specific error messages based on error codes
          if (errorCode === 'GP51_AUTH_FAILED' || errorCode === 'GP51_AUTH_EXCEPTION') {
            throw new Error('GP51 authentication failed: Invalid username or password');
          } else if (errorCode === 'DB_CONNECTION_FAILED' || errorCode === 'DB_SAVE_FAILED' || errorCode === 'SESSION_CREATION_FAILED' || errorCode === 'DB_VERIFICATION_FAILED') {
            throw new Error('Database error: Unable to save credentials. Please try again.');
          } else if (errorCode === 'AUTH_REQUIRED' || errorCode === 'AUTH_INVALID') {
            throw new Error('Authentication required: Please refresh the page and log in again');
          } else if (errorCode === 'MISSING_ENV_VARS') {
            throw new Error('Server configuration error: Please contact support');
          } else if (errorCode === 'INVALID_JSON') {
            throw new Error('Request format error: Please try again');
          }
          
          throw new Error(errorMessage);
        }
        
        console.log('✅ GP51 credentials saved successfully:', {
          success: data.success,
          message: data.message,
          username: data.username
        });
        return data;
        
      } catch (fetchError) {
        console.error('❌ Request execution failed:', {
          error: fetchError,
          name: fetchError?.name,
          message: fetchError?.message,
          stack: fetchError?.stack?.substring(0, 200)
        });
        
        // Re-throw with better error context if it's our own error
        if (fetchError instanceof Error && fetchError.message.includes('GP51')) {
          throw fetchError;
        }
        
        // For unexpected errors, provide a generic message with enhanced context
        throw new Error(`Connection failed: Unable to save GP51 credentials. ${fetchError instanceof Error ? fetchError.message : 'Please try again.'}`);
      }
    },
    onSuccess: async (data) => {
      console.log('🎉 GP51 credentials save mutation succeeded');
      
      const responseData = data as { message?: string; success?: boolean; testOnly?: boolean; username?: string; sessionVerified?: boolean };
      
      // If this was a real save (not test), verify the session works with GP51 API
      if (!responseData?.testOnly) {
        console.log('🧪 Auto-verifying saved credentials with GP51 API...');
        
        try {
          // Test the real GP51 API to ensure credentials work
          const { data: testData, error: testError } = await supabase.functions.invoke('gp51-service-management', {
            body: { action: 'test_gp51_api' }
          });

          console.log('🧪 Auto-verification result:', {
            hasData: !!testData,
            hasError: !!testError,
            success: testData?.success,
            deviceCount: testData?.deviceCount
          });

          if (testError || !testData?.success) {
            console.error('❌ Auto-verification failed:', {
              testError: testError?.message,
              testData: testData
            });
            
            // Report verification failure to status coordinator
            gp51StatusCoordinator.reportSaveError(
              `Credentials saved but API test failed: ${testData?.details || testError?.message || 'Unknown error'}`
            );
            
            toast({
              title: 'Credentials Saved with Warning',
              description: 'Credentials saved but GP51 API verification failed. Please check your connection.',
              variant: 'destructive'
            });
            return;
          }

          console.log('✅ Auto-verification successful');
          // Notify status coordinator of successful save and verification
          gp51StatusCoordinator.reportSaveSuccess(responseData?.username);
          
          toast({ 
            title: 'GP51 Credentials Saved & Verified',
            description: `Successfully connected and verified with GP51 API. Found ${testData.deviceCount || 0} devices.`
          });

        } catch (verificationError) {
          console.error('❌ Auto-verification exception:', {
            error: verificationError,
            name: verificationError?.name,
            message: verificationError?.message
          });
          
          // Still report success but with warning
          gp51StatusCoordinator.reportSaveSuccess(responseData?.username);
          
          toast({
            title: 'Credentials Saved',
            description: 'Credentials saved but verification test could not be performed.',
            variant: 'default'
          });
        }
      } else {
        // Test-only mode
        gp51StatusCoordinator.reportSaveSuccess(responseData?.username);
        
        toast({ 
          title: 'Connection Test Successful',
          description: responseData?.message || 'GP51 connection test passed!'
        });
      }
      
      // Clear form fields
      setUsername('');
      setPassword('');
      setApiUrl('');

      // Invalidate queries after a delay to prevent conflicts
      if (!responseData?.testOnly) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
        }, 2000);
      }
    },
    onError: (error: unknown) => {
      console.error('❌ GP51 credentials save mutation failed:', {
        error: error,
        name: error?.name,
        message: error?.message,
        stack: error?.stack?.substring(0, 200)
      });
      
      // Properly handle the error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Notify status coordinator of save error
      gp51StatusCoordinator.reportSaveError(errorMessage);
      
      // Enhanced error categorization for better user feedback
      let errorTitle = 'Connection Failed';
      let errorDescription = 'Failed to connect to GP51. Please check your credentials and try again.';
      
      if (errorMessage.includes('Authentication required') || errorMessage.includes('logged in') || errorMessage.includes('session has expired')) {
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
      } else if (errorMessage.includes('Server configuration error')) {
        errorTitle = 'Server Configuration Error';
        errorDescription = 'Server configuration issue. Please contact support.';
      } else if (errorMessage.includes('Request format error')) {
        errorTitle = 'Request Error';
        errorDescription = 'Invalid request format. Please try again.';
      } else if (errorMessage.includes('timeout')) {
        errorTitle = 'Request Timeout';
        errorDescription = 'Request timed out. Please try again.';
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
