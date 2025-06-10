
import { useState, useCallback } from 'react';
import { gp51DiagnosticService } from '@/services/gp51/diagnosticService';
import { enhancedGP51ApiService } from '@/services/gp51/enhancedGP51ApiService';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

export const useGP51Diagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const { toast } = useToast();

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    try {
      console.log('🔍 Starting GP51 diagnostics...');
      const diagnosticResults = await gp51DiagnosticService.runFullDiagnostic();
      
      setResults(diagnosticResults);
      setLastRun(new Date());
      
      await gp51DiagnosticService.logDiagnosticResults(diagnosticResults);
      
      const failedTests = diagnosticResults.filter(r => r.status === 'fail').length;
      const warningTests = diagnosticResults.filter(r => r.status === 'warning').length;
      
      if (failedTests === 0 && warningTests === 0) {
        toast({
          title: "Diagnostics Completed",
          description: "All tests passed successfully! GP51 integration is healthy.",
        });
      } else if (failedTests > 0) {
        toast({
          title: "Issues Detected",
          description: `${failedTests} test(s) failed, ${warningTests} warning(s). Check the results for details.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Minor Issues Detected",
          description: `${warningTests} warning(s) found. System is functional but may need attention.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Diagnostic run failed:', error);
      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  }, [toast]);

  const runFullSync = useCallback(async () => {
    try {
      console.log('🔄 Starting enhanced full sync...');
      const result = await enhancedGP51ApiService.performFullSync();
      
      if (result.success) {
        toast({
          title: "Sync Completed",
          description: `Successfully synced ${result.result?.devicesFound || 0} devices with ${result.result?.positionsFetched || 0} positions.`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Unknown sync error occurred",
          variant: "destructive"
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Sync Error",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const getSyncStatus = useCallback(() => {
    return enhancedGP51ApiService.getSyncStatus();
  }, []);

  return {
    isRunning,
    results,
    lastRun,
    runDiagnostics,
    runFullSync,
    getSyncStatus
  };
};
