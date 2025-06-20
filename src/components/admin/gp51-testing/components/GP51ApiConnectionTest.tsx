
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Zap } from 'lucide-react';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import TestResultAlert from './TestResultAlert';
import TestButton from './TestButton';
import type { ConnectionTestResult, GP51ApiConnectionTestProps } from '../types/connectionTesting';

const GP51ApiConnectionTest: React.FC<GP51ApiConnectionTestProps> = ({
  isGp51Authenticated,
  authLoading,
  onTestResult,
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ConnectionTestResult | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsTestingConnection(true);
    setLastTestResult(null);

    if (!isGp51Authenticated) {
      const errorMsg = 'Not authenticated with GP51. Please authenticate first.';
      const result: ConnectionTestResult = { success: false, error: errorMsg, timestamp: new Date() };
      setLastTestResult(result);
      onTestResult(result);
      toast({ title: "Authentication Required", description: errorMsg, variant: "destructive" });
      setIsTestingConnection(false);
      return;
    }

    try {
      console.log('🔧 Testing GP51 API connection using "test_gp51_api" action...');
      const { data: apiResponse, error: functionError } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_gp51_api' }
      });

      let result: ConnectionTestResult;

      if (functionError) {
        console.error('Supabase function invocation error:', functionError);
        result = { success: false, error: `Function error: ${functionError.message}`, timestamp: new Date() };
        toast({ title: "Connection Test Failed", description: result.error, variant: "destructive" });
      } else if (apiResponse?.isValid) {
        const details = apiResponse.details || `Connected as ${apiResponse.username || 'user'}. Latency: ${apiResponse.latency}ms. Devices: ${apiResponse.deviceCount || 0}.`;
        result = { 
          success: true, 
          details: details,
          data: { 
            total_devices: apiResponse.deviceCount || 0,
            total_positions: 0,
            fetched_at: new Date().toISOString()
          },
          timestamp: new Date()
        };
        toast({ title: "Connection Test Successful", description: `GP51 API is responding correctly. (${apiResponse.status})` });
      } else {
        const errorMsg = apiResponse?.errorMessage || 'Connection test failed: Unknown reason from API.';
        console.error('GP51 API Test Failed:', apiResponse);
        result = { 
          success: false, 
          error: errorMsg,
          details: `Status: ${apiResponse?.status}. ${apiResponse?.needsRefresh ? 'Session needs refresh.' : ''}`,
          timestamp: new Date()
        };
        toast({ title: "Connection Test Failed", description: errorMsg, variant: "destructive" });
      }
      setLastTestResult(result);
      onTestResult(result);
    } catch (error) {
      console.error('Unexpected error during connection test:', error);
      const errorDetails = error instanceof Error ? error.message : 'Unknown error';
      const result: ConnectionTestResult = { 
        success: false, 
        error: 'Test failed due to an unexpected client-side error.',
        details: errorDetails,
        timestamp: new Date()
      };
      setLastTestResult(result);
      onTestResult(result);
      toast({ title: "Connection Test Error", description: `Client error: ${errorDetails}`, variant: "destructive" });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">API Connection Test</h4>
          <ConnectionStatusBadge result={lastTestResult} isLoading={isTestingConnection} authLoading={authLoading} />
        </div>
        <TestButton
          onClick={testConnection}
          disabled={!isGp51Authenticated || authLoading}
          isLoading={isTestingConnection}
          authLoading={authLoading}
          idleText="Test API Connection"
          IconComponent={Zap}
        />
      </div>
      <TestResultAlert result={lastTestResult} testType="API_CONNECTION" />
    </div>
  );
};

export default GP51ApiConnectionTest;
