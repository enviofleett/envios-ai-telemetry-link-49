
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Zap } from 'lucide-react';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import TestResultAlert from './TestResultAlert';
import TestButton from './TestButton';
import type { ConnectionTestResult, GP51ApiConnectionTestProps } from '../types/connectionTesting';
import { useGP51Auth } from '@/hooks/useGP51Auth'; // Import useGP51Auth

const GP51ApiConnectionTest: React.FC<GP51ApiConnectionTestProps> = ({
  isGp51Authenticated,
  authLoading,
  onTestResult,
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ConnectionTestResult | null>(null);
  const { toast } = useToast();
  const { healthCheck: gp51HealthCheck, username: gp51Username } = useGP51Auth();


  const testConnection = async () => {
    setIsTestingConnection(true);
    setLastTestResult(null);

    try {
      console.log('🔧 Testing GP51 connection phase 1: Client-side session health check...');
      const isSessionHealthy = await gp51HealthCheck();

      if (!isSessionHealthy || !isGp51Authenticated) {
        const errorMsg = 'GP51 session is not valid or has expired. Please re-authenticate in the Authentication tab.';
        const result = { success: false, error: errorMsg, timestamp: new Date() };
        setLastTestResult(result);
        onTestResult(result);
        toast({ title: "Session Check Failed", description: errorMsg, variant: "destructive" });
        setIsTestingConnection(false);
        return;
      }
      
      console.log('🔧 Testing GP51 connection phase 2: Edge function API test...');
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      let result: ConnectionTestResult;
      if (error) {
        result = { success: false, error: error.message, timestamp: new Date() };
        toast({ title: "Connection Test Failed", description: error.message, variant: "destructive" });
      } else if (data.success) {
        result = { 
          success: true, 
          details: `Connected as ${data.username || gp51Username || 'unknown user'}`,
          timestamp: new Date()
        };
        toast({ title: "Connection Test Successful", description: `GP51 API is responding correctly` });
      } else {
        result = { 
          success: false, 
          error: data.error || 'Connection test failed',
          details: data.details,
          timestamp: new Date()
        };
        toast({ title: "Connection Test Failed", description: data.error || "GP51 API connection failed", variant: "destructive" });
      }
      setLastTestResult(result);
      onTestResult(result);
    } catch (error) {
      const result = { 
        success: false, 
        error: 'Test failed due to an unexpected error.',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      setLastTestResult(result);
      onTestResult(result);
      toast({ title: "Connection Test Error", description: "Failed to test GP51 connection", variant: "destructive" });
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
          disabled={!isGp51Authenticated}
          isLoading={isTestingConnection}
          authLoading={authLoading}
          idleText="Test Connection"
          IconComponent={Zap}
        />
      </div>
      <TestResultAlert result={lastTestResult} testType="API_CONNECTION" />
    </div>
  );
};

export default GP51ApiConnectionTest;
