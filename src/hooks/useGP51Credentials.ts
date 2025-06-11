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

  // Helper function to validate function deployment and generate debug info
  const validateFunctionDeployment = () => {
    const projectRef = 'bjkqxmvjuewshomihjqm'; // From supabase config
    const functionName = 'settings-management';
    const expectedUrl = `https://${projectRef}.functions.supabase.co/${functionName}`;
    
    console.log('🔍 Function Deployment Debug Info:', {
      projectRef,
      functionName,
      expectedUrl,
      timestamp: new Date().toISOString()
    });
    
    return { projectRef, functionName, expectedUrl };
  };

  // Helper function to generate cURL command for manual testing
  const generateCurlCommand = (token: string, testPayload: any) => {
    const { expectedUrl } = validateFunctionDeployment();
    const curlCommand = `curl -X POST ${expectedUrl} \\
  -H "Authorization: Bearer ${token.substring(0, 20)}..." \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(testPayload, null, 2)}'`;
    
    console.log('🛠️ Manual cURL Test Command:', curlCommand);
    return curlCommand;
  };

  // Enhanced token validation with detailed logging
  const validateAuthToken = async (session: any) => {
    console.log('🔐 Enhanced Token Validation:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length || 0,
      tokenPrefix: session?.access_token?.substring(0, 20) + '...' || 'none',
      userEmail: session?.user?.email || 'none',
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
      isExpired: session?.expires_at ? session.expires_at < Date.now() / 1000 : 'unknown',
      tokenType: session?.token_type || 'unknown'
    });

    if (!session || !session.access_token) {
      throw new Error('Authentication required: No valid session or access token found. Please refresh the page and log in again.');
    }

    if (session.expires_at && session.expires_at < Date.now() / 1000) {
      throw new Error('Authentication expired: Your session has expired. Please refresh the page and log in again.');
    }

    return session;
  };

  // Function health check method
  const testFunctionHealth = async () => {
    console.log('🏥 Testing Edge Function Health...');
    validateFunctionDeployment();
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No valid session for health check');
      }

      await validateAuthToken(session);
      generateCurlCommand(session.access_token, { action: 'health-check' });

      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'health-check' }
      });

      console.log('✅ Function Health Check Result:', {
        success: !error && data,
        data,
        error: error?.message,
        timestamp: new Date().toISOString()
      });

      return { success: !error && data, data, error };
    } catch (error) {
      console.error('❌ Function Health Check Failed:', error);
      return { success: false, error };
    }
  };

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
      console.log('🚀 Starting GP51 credentials save mutation with enhanced debugging...');
      setIsSaving(true);
      
      // Validate function deployment first
      validateFunctionDeployment();
      
      // Notify status coordinator that save is starting
      gp51StatusCoordinator.startSaveOperation();
      
      // Enhanced authentication state checking with detailed logging
      console.log('🔍 Enhanced session validation starting...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ Session retrieval failed:', {
          sessionError: sessionError?.message,
          hasSession: !!session
        });
        throw new Error('Authentication required: Failed to retrieve session. Please refresh the page and try again.');
      }

      // Use enhanced token validation
      await validateAuthToken(session);

      const payload: any = { 
        action: 'save-gp51-credentials',
        username,
        password
      };

      if (apiUrl && apiUrl.trim()) {
        payload.apiUrl = apiUrl.trim();
      }

      console.log('📡 Enhanced function invocation with payload:', {
        action: payload.action,
        hasUsername: !!payload.username,
        hasPassword: !!payload.password,
        hasApiUrl: !!payload.apiUrl,
        retryAttempt: retryCount,
        functionName: 'settings-management'
      });
      
      // Generate cURL command for debugging
      generateCurlCommand(session.access_token, payload);
      
      try {
        const { data, error } = await supabase.functions.invoke('settings-management', {
          body: payload
        });
        
        console.log('📡 Enhanced Edge function response analysis:', {
          hasData: !!data,
          hasError: !!error,
          dataSuccess: data?.success,
          errorMessage: error?.message,
          dataCode: data?.code,
          responseType: typeof data,
          fullError: error
        });
        
        // Enhanced HTTP-level error checking
        if (error) {
          console.error('❌ Edge function invocation failed with enhanced context:', {
            error: error.message,
            context: error.context,
            details: error.details,
            retryCount,
            functionUrl: validateFunctionDeployment().expectedUrl
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
          
          if (error.message?.includes('404') || error.message?.includes('not found')) {
            console.error('🚨 Function deployment issue detected:', validateFunctionDeployment());
            throw new Error('Edge function not found. Please contact support.');
          }
          
          throw new Error(error.message || 'Edge function call failed');
        }
        
        // Enhanced response validation with detailed error reporting
        if (!data || data.success === false) {
          console.error('❌ GP51 save operation failed with enhanced analysis:', {
            data: data,
            success: data?.success,
            error: data?.error,
            code: data?.code,
            details: data?.details,
            functionHealth: await testFunctionHealth()
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
        
        console.log('✅ GP51 credentials saved successfully with enhanced logging:', {
          success: data.success,
          message: data.message,
          username: data.username,
          functionHealth: 'ok'
        });
        return data;
        
      } catch (fetchError) {
        console.error('❌ Request execution failed with enhanced context:', {
          error: fetchError,
          name: fetchError instanceof Error ? fetchError.name : 'unknown',
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          stack: fetchError instanceof Error ? fetchError.stack?.substring(0, 200) : 'no stack',
          functionDeployment: validateFunctionDeployment(),
          retryCount
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
      console.log('🎉 GP51 credentials save mutation succeeded with enhanced logging');
      
      const responseData = data as { message?: string; success?: boolean; testOnly?: boolean; username?: string; sessionVerified?: boolean };
      
      // If this was a real save (not test), verify the session works with GP51 API
      if (!responseData?.testOnly) {
        console.log('🧪 Auto-verifying saved credentials with GP51 API...');
        
        try {
          // Test the real GP51 API to ensure credentials work
          const { data: testData, error: testError } = await supabase.functions.invoke('gp51-service-management', {
            body: { action: 'test_gp51_api' }
          });

          console.log('🧪 Auto-verification result with enhanced logging:', {
            hasData: !!testData,
            hasError: !!testError,
            success: testData?.success,
            deviceCount: testData?.deviceCount,
            errorDetails: testError
          });

          if (testError || !testData?.success) {
            console.error('❌ Auto-verification failed with context:', {
              testError: testError?.message,
              testData: testData,
              functionHealth: await testFunctionHealth()
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

          console.log('✅ Auto-verification successful with enhanced confirmation');
          // Notify status coordinator of successful save and verification
          gp51StatusCoordinator.reportSaveSuccess(responseData?.username);
          
          toast({ 
            title: 'GP51 Credentials Saved & Verified',
            description: `Successfully connected and verified with GP51 API. Found ${testData.deviceCount || 0} devices.`
          });

        } catch (verificationError) {
          console.error('❌ Auto-verification exception with enhanced context:', {
            error: verificationError,
            name: verificationError instanceof Error ? verificationError.name : 'unknown',
            message: verificationError instanceof Error ? verificationError.message : String(verificationError),
            functionHealth: await testFunctionHealth()
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
      // Safe error handling for unknown type
      const safeError = error instanceof Error ? error : { 
        name: 'UnknownError', 
        message: String(error), 
        stack: undefined 
      };
      
      console.error('❌ GP51 credentials save mutation failed with enhanced error context:', {
        error: safeError,
        name: safeError.name,
        message: safeError.message,
        stack: safeError.stack?.substring(0, 200),
        functionDeployment: validateFunctionDeployment(),
        timestamp: new Date().toISOString()
      });
      
      // Properly handle the error message
      const errorMessage = safeError.message;
      
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
      } else if (errorMessage.includes('Edge function not found')) {
        errorTitle = 'Service Unavailable';
        errorDescription = 'Backend service unavailable. Please contact support.';
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
    
    console.log('🚀 Initiating GP51 credentials save with enhanced debugging...');
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
    isLoading: saveCredentialsMutation.isPending || isSaving,
    testFunctionHealth // Expose health check for manual testing
  };
};
