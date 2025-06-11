
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionTestResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  statusCode?: number;
  isAuthError?: boolean;
  latency?: number;
  username?: string;
  token?: string;
  recommendation?: string;
}

export const useGP51ConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Testing GP51 connection via enhanced edge function...');
      
      const { data, error } = await supabase.functions.invoke('gp51-connection-check', {
        body: {}
      });

      if (error) {
        console.error('❌ Connection test failed:', error);
        setResult({
          success: false,
          error: 'Connection test failed',
          details: error.message,
          statusCode: 500,
          isAuthError: false
        });
        return;
      }

      console.log('✅ Connection test result:', data);
      setResult(data);
      
    } catch (err) {
      console.error('❌ Connection test exception:', err);
      setResult({
        success: false,
        error: 'Test failed',
        details: err instanceof Error ? err.message : 'Unknown error',
        statusCode: 500,
        isAuthError: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testConnection,
    isLoading,
    result
  };
};
