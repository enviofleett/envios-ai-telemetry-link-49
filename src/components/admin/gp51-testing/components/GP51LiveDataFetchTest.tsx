
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity } from 'lucide-react';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import TestResultAlert from './TestResultAlert';
import TestButton from './TestButton';
import type { ConnectionTestResult, GP51LiveDataFetchTestProps } from '../types/connectionTesting';

const GP51LiveDataFetchTest: React.FC<GP51LiveDataFetchTestProps> = ({
  isGp51Authenticated,
  authLoading,
  isApiTestSuccessful,
}) => {
  const [isFetchingLiveData, setIsFetchingLiveData] = useState(false);
  const [lastLiveDataResult, setLastLiveDataResult] = useState<ConnectionTestResult | null>(null);
  const { toast } = useToast();

  const fetchLiveData = async () => {
    setIsFetchingLiveData(true);
    setLastLiveDataResult(null);
    try {
      if (!isGp51Authenticated) {
        const errorMsg = "Not authenticated with GP51. Please authenticate first.";
        setLastLiveDataResult({ success: false, error: errorMsg, timestamp: new Date() });
        toast({ title: "Authentication Required", description: errorMsg, variant: "destructive" });
        setIsFetchingLiveData(false);
        return;
      }

      console.log('📡 Fetching live GP51 data...');
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data');

      let result: ConnectionTestResult;
      if (error) {
        result = { success: false, error: error.message, timestamp: new Date() };
        toast({ title: "Live Data Fetch Failed", description: error.message, variant: "destructive" });
      } else if (data.success) {
        result = { 
          success: true, 
          data: data.data,
          details: `Fetched ${data.data.total_positions} positions from ${data.data.total_devices} devices.`,
          timestamp: new Date()
        };
        toast({ title: "Live Data Fetched Successfully", description: `Retrieved data for ${data.data.total_devices} devices` });
      } else {
        result = { 
          success: false, 
          error: data.error || 'Live data fetch failed',
          details: data.details,
          timestamp: new Date()
        };
        toast({ title: "Live Data Fetch Failed", description: data.error || "Failed to fetch live data", variant: "destructive" });
      }
      setLastLiveDataResult(result);
    } catch (error) {
      const result = { 
        success: false, 
        error: 'Fetch failed due to an unexpected error.',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      setLastLiveDataResult(result);
      toast({ title: "Live Data Error", description: "Failed to fetch live GP51 data", variant: "destructive" });
    } finally {
      setIsFetchingLiveData(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Live Data Fetch Test</h4>
          <ConnectionStatusBadge result={lastLiveDataResult} isLoading={isFetchingLiveData} authLoading={authLoading} />
        </div>
        <TestButton
          onClick={fetchLiveData}
          disabled={!isGp51Authenticated || !isApiTestSuccessful}
          isLoading={isFetchingLiveData}
          authLoading={authLoading}
          idleText="Fetch Live Data"
          IconComponent={Activity}
        />
      </div>
      <TestResultAlert result={lastLiveDataResult} testType="LIVE_DATA" />
    </div>
  );
};

export default GP51LiveDataFetchTest;
