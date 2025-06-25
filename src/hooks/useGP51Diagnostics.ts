
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DiagnosticTestResult {
  testName: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  timestamp: string;
  duration: number;
  success: boolean;
  httpStatus?: number;
  httpStatusText?: string;
  responseHeaders?: Record<string, string>;
  responseBodyRaw?: string;
  responseBodyLength?: number;
  responseBodyParsed?: any;
  isJsonResponse?: boolean;
  jsonParseError?: string;
  error?: string;
  errorType?: string;
  timedOut?: boolean;
}

export interface DiagnosticResponse {
  success: boolean;
  message: string;
  diagnosticInfo: {
    timestamp: string;
    sessionInfo: {
      username: string;
      tokenLength: number;
      tokenExpiry: string;
      apiUrl: string;
      sessionAge: number;
    };
    networkInfo: {
      userAgent?: string;
      origin?: string;
      referer?: string;
    };
  };
  testResults: DiagnosticTestResult[];
  summary: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    timeoutTests: number;
  };
}

export const useGP51Diagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResponse | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      console.log('🔍 Starting GP51 raw diagnostic tests...');

      const { data, error } = await supabase.functions.invoke('gp51-raw-diagnostic', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setResults(data);
      setLastRun(new Date());

      toast({
        title: "Diagnostic Tests Complete",
        description: `Completed ${data.summary.totalTests} tests. Success: ${data.summary.successfulTests}/${data.summary.totalTests}`,
        variant: data.summary.failedTests > 0 ? "destructive" : "default"
      });

    } catch (error) {
      console.error('❌ Diagnostic tests failed:', error);
      
      toast({
        title: "Diagnostic Tests Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    results,
    lastRun,
    runDiagnostics
  };
};
