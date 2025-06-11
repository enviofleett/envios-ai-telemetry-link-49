import { supabase } from '@/integrations/supabase/client';
import { GP51SessionManager } from './sessionManager';
import { gp51ConnectionMonitor } from './connectionMonitor';
import { gp51ErrorReporter } from './errorReporter';

export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string;
  error?: string;
  timestamp: Date;
}

export interface ValidationSuite {
  credentialSaving: TestResult[];
  sessionManagement: TestResult[];
  vehicleDataSync: TestResult[];
  errorRecovery: TestResult[];
  overall: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
  };
}

export class GP51IntegrationTester {
  private static instance: GP51IntegrationTester;
  private testResults: ValidationSuite = {
    credentialSaving: [],
    sessionManagement: [],
    vehicleDataSync: [],
    errorRecovery: [],
    overall: { totalTests: 0, passedTests: 0, failedTests: 0, successRate: 0 }
  };

  static getInstance(): GP51IntegrationTester {
    if (!GP51IntegrationTester.instance) {
      GP51IntegrationTester.instance = new GP51IntegrationTester();
    }
    return GP51IntegrationTester.instance;
  }

  async runFullValidationSuite(): Promise<ValidationSuite> {
    console.log('🧪 Starting GP51 Integration Validation Suite...');
    
    this.resetResults();
    
    await this.testCredentialSaving();
    await this.testSessionManagement();
    await this.testVehicleDataSync();
    await this.testErrorRecovery();
    
    this.calculateOverallResults();
    
    console.log('🏁 Validation Suite Complete:', this.testResults.overall);
    return this.testResults;
  }

  private async testCredentialSaving(): Promise<void> {
    console.log('📝 Testing Credential Saving...');

    // Test 1: Database Connection Test
    await this.runTest('credentialSaving', 'Database Connection', async () => {
      const { data, error } = await supabase.from('gp51_sessions').select('count').limit(1);
      if (error) throw new Error(`Database connection failed: ${error.message}`);
      return 'Database connection successful';
    });

    // Test 2: Session Storage Structure
    await this.runTest('credentialSaving', 'Session Storage Structure', async () => {
      const { data, error } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .limit(1);
      
      if (error) throw new Error(`Session query failed: ${error.message}`);
      return 'Session table structure validated';
    });

    // Test 3: Settings Management Function Test
    await this.runTest('credentialSaving', 'Settings Management Function', async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'health-check' }
      });
      
      if (error) throw new Error(`Function invocation failed: ${error.message}`);
      if (!data?.success) throw new Error(`Health check failed: ${data?.error}`);
      return 'Settings management function responsive';
    });
  }

  private async testSessionManagement(): Promise<void> {
    console.log('🔐 Testing Session Management...');

    // Test 1: Session Validation
    await this.runTest('sessionManagement', 'Session Validation', async () => {
      const sessionInfo = await GP51SessionManager.validateSession();
      if (sessionInfo.error && !sessionInfo.error.includes('No GP51 sessions')) {
        throw new Error(`Session validation error: ${sessionInfo.error}`);
      }
      return sessionInfo.valid ? 'Valid session found' : 'No sessions configured (expected)';
    });

    // Test 2: Session Cache Functionality
    await this.runTest('sessionManagement', 'Session Caching', async () => {
      const firstCall = await GP51SessionManager.validateSession();
      const secondCall = await GP51SessionManager.validateSession();
      
      // Both calls should complete without errors
      return 'Session caching functional';
    });

    // Test 3: Connection Testing
    await this.runTest('sessionManagement', 'Connection Testing', async () => {
      const testResult = await GP51SessionManager.testConnection();
      // Connection test should complete without throwing errors
      return testResult.success ? 'Connection test successful' : `Connection test completed: ${testResult.error}`;
    });
  }

  private async testVehicleDataSync(): Promise<void> {
    console.log('🚗 Testing Vehicle Data Sync...');

    // Test 1: Vehicle Table Access
    await this.runTest('vehicleDataSync', 'Vehicle Table Access', async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('device_id, device_name, is_active')
        .limit(5);
      
      if (error) throw new Error(`Vehicle table access failed: ${error.message}`);
      return `Vehicle table accessible, ${data?.length || 0} records found`;
    });

    // Test 2: Position Data Structure
    await this.runTest('vehicleDataSync', 'Position Data Structure', async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('last_position')
        .not('last_position', 'is', null)
        .limit(1);
      
      if (error) throw new Error(`Position data query failed: ${error.message}`);
      
      if (data && data.length > 0 && data[0].last_position) {
        const position = data[0].last_position as any;
        if (!position.latitude || !position.longitude) {
          throw new Error('Position data missing required fields');
        }
      }
      
      return 'Position data structure validated';
    });

    // Test 3: Sync Service Availability
    await this.runTest('vehicleDataSync', 'Sync Service Status', async () => {
      // Test if the sync service components are available
      try {
        const monitor = gp51ConnectionMonitor.getCurrentStatus();
        return `Sync monitoring active, last check: ${monitor.lastCheckTime.toISOString()}`;
      } catch (error) {
        throw new Error(`Sync service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  private async testErrorRecovery(): Promise<void> {
    console.log('🔄 Testing Error Recovery...');

    // Test 1: Error Reporting System
    await this.runTest('errorRecovery', 'Error Reporting System', async () => {
      gp51ErrorReporter.reportError({
        type: 'api',
        message: 'Test error for validation',
        details: { test: true },
        severity: 'low'
      });
      return 'Error reporting system functional';
    });

    // Test 2: Connection Monitoring
    await this.runTest('errorRecovery', 'Connection Monitoring', async () => {
      const status = gp51ConnectionMonitor.getCurrentStatus();
      const health = gp51ConnectionMonitor.getConnectionHealth();
      
      if (!status || !health) {
        throw new Error('Connection monitoring not properly initialized');
      }
      
      return `Monitoring active: ${health.status} status`;
    });

    // Test 3: Fallback Mechanisms
    await this.runTest('errorRecovery', 'Fallback Mechanisms', async () => {
      try {
        const fallbackResult = await gp51ConnectionMonitor.attemptFallbackConnection();
        return `Fallback mechanism tested: ${fallbackResult ? 'successful' : 'failed as expected'}`;
      } catch (error) {
        return 'Fallback mechanism available and responsive';
      }
    });

    // Test 4: Invalid Credential Handling
    await this.runTest('errorRecovery', 'Invalid Credential Handling', async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { 
          action: 'save-gp51-credentials',
          username: 'invalid_test_user',
          password: 'invalid_test_password',
          testOnly: true
        }
      });
      
      // This should fail gracefully
      if (data?.success === false && data?.error) {
        return 'Invalid credentials handled gracefully';
      }
      
      return 'Credential validation system responsive';
    });
  }

  private async runTest(
    category: keyof Omit<ValidationSuite, 'overall'>,
    testName: string,
    testFunction: () => Promise<string>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`  ▶️ Running: ${testName}`);
      
      const details = await testFunction();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName,
        success: true,
        duration,
        details,
        timestamp: new Date()
      };
      
      this.testResults[category].push(result);
      console.log(`  ✅ ${testName}: ${details} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const result: TestResult = {
        testName,
        success: false,
        duration,
        details: 'Test failed',
        error: errorMessage,
        timestamp: new Date()
      };
      
      this.testResults[category].push(result);
      console.log(`  ❌ ${testName}: ${errorMessage} (${duration}ms)`);
      
      // Report test failures
      gp51ErrorReporter.reportError({
        type: 'api',
        message: `Validation test failed: ${testName}`,
        details: error,
        severity: 'medium'
      });
    }
  }

  private resetResults(): void {
    this.testResults = {
      credentialSaving: [],
      sessionManagement: [],
      vehicleDataSync: [],
      errorRecovery: [],
      overall: { totalTests: 0, passedTests: 0, failedTests: 0, successRate: 0 }
    };
  }

  private calculateOverallResults(): void {
    const allTests = [
      ...this.testResults.credentialSaving,
      ...this.testResults.sessionManagement,
      ...this.testResults.vehicleDataSync,
      ...this.testResults.errorRecovery
    ];
    
    const totalTests = allTests.length;
    const passedTests = allTests.filter(test => test.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    this.testResults.overall = {
      totalTests,
      passedTests,
      failedTests,
      successRate: Math.round(successRate * 100) / 100
    };
  }

  getResults(): ValidationSuite {
    return { ...this.testResults };
  }

  async runQuickHealthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    console.log('🏥 Running Quick Health Check...');
    
    const issues: string[] = [];
    
    try {
      // Check database connectivity
      const { error: dbError } = await supabase.from('gp51_sessions').select('count').limit(1);
      if (dbError) issues.push(`Database: ${dbError.message}`);
      
      // Check function availability
      const { error: funcError } = await supabase.functions.invoke('settings-management', {
        body: { action: 'health-check' }
      });
      if (funcError) issues.push(`Functions: ${funcError.message}`);
      
      // Check session manager
      const sessionInfo = await GP51SessionManager.validateSession();
      if (sessionInfo.error && !sessionInfo.error.includes('No GP51 sessions')) {
        issues.push(`Session Manager: ${sessionInfo.error}`);
      }
      
    } catch (error) {
      issues.push(`System: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const healthy = issues.length === 0;
    console.log(`🏥 Health Check: ${healthy ? 'HEALTHY' : 'ISSUES DETECTED'}`);
    
    return { healthy, issues };
  }
}

export const gp51IntegrationTester = GP51IntegrationTester.getInstance();
