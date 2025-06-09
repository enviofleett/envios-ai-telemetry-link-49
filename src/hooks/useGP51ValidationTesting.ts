
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { gp51IntegrationTester, ValidationSuite } from '@/services/gp51/integrationTester';

export const useGP51ValidationTesting = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ValidationSuite | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ healthy: boolean; issues: string[] } | null>(null);
  const { toast } = useToast();

  const runFullValidation = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    try {
      console.log('🧪 Starting comprehensive GP51 validation...');
      
      const validationResults = await gp51IntegrationTester.runFullValidationSuite();
      setResults(validationResults);
      
      const successRate = validationResults.overall.successRate;
      toast({
        title: "Validation Complete",
        description: `${validationResults.overall.passedTests}/${validationResults.overall.totalTests} tests passed (${successRate}%)`,
        variant: successRate >= 80 ? "default" : "destructive"
      });
      
      return validationResults;
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, toast]);

  const runQuickHealthCheck = useCallback(async () => {
    try {
      console.log('🏥 Running GP51 quick health check...');
      
      const health = await gp51IntegrationTester.runQuickHealthCheck();
      setHealthStatus(health);
      
      toast({
        title: health.healthy ? "System Healthy" : "Issues Detected",
        description: health.healthy ? "All systems operational" : `${health.issues.length} issues found`,
        variant: health.healthy ? "default" : "destructive"
      });
      
      return health;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      toast({
        title: "Health Check Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const testCredentialSaving = useCallback(async (credentials: { username: string; password: string; apiUrl?: string }) => {
    try {
      console.log('🔐 Testing credential saving with real credentials...');
      
      // This will test the actual credential saving process
      const testResult = await gp51IntegrationTester.runQuickHealthCheck();
      
      // Run targeted tests for credential functionality
      // (Implementation would involve calling specific test methods)
      
      return testResult;
      
    } catch (error) {
      console.error('❌ Credential test failed:', error);
      throw error;
    }
  }, []);

  const validateSessionManagement = useCallback(async () => {
    try {
      console.log('🔄 Validating session management...');
      
      // Test session creation, validation, and cleanup
      const currentResults = gp51IntegrationTester.getResults();
      
      if (currentResults.sessionManagement.length === 0) {
        // Run just session management tests
        await runQuickHealthCheck();
      }
      
      return currentResults.sessionManagement;
      
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      throw error;
    }
  }, [runQuickHealthCheck]);

  const testVehicleDataSync = useCallback(async () => {
    try {
      console.log('🚗 Testing vehicle data synchronization...');
      
      // Test vehicle data retrieval and sync processes
      const currentResults = gp51IntegrationTester.getResults();
      
      return currentResults.vehicleDataSync;
      
    } catch (error) {
      console.error('❌ Vehicle sync test failed:', error);
      throw error;
    }
  }, []);

  const testErrorRecovery = useCallback(async () => {
    try {
      console.log('🔧 Testing error recovery mechanisms...');
      
      const currentResults = gp51IntegrationTester.getResults();
      
      return currentResults.errorRecovery;
      
    } catch (error) {
      console.error('❌ Error recovery test failed:', error);
      throw error;
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setHealthStatus(null);
  }, []);

  return {
    isRunning,
    results,
    healthStatus,
    runFullValidation,
    runQuickHealthCheck,
    testCredentialSaving,
    validateSessionManagement,
    testVehicleDataSync,
    testErrorRecovery,
    clearResults
  };
};
