
import { supabase } from '@/integrations/supabase/client';
import { GP51SessionManager } from './sessionManager';

export interface IntegrationTestResult {
  testName: string;
  success: boolean;
  message: string;
  duration: number;
  details?: any;
}

export interface IntegrationTestSuite {
  suiteName: string;
  results: IntegrationTestResult[];
  overallSuccess: boolean;
  totalDuration: number;
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
}

export class GP51IntegrationTester {
  private cachedResults: IntegrationTestSuite | null = null;

  // Add the missing runFullValidationSuite method (alias for existing method)
  async runFullValidationSuite(): Promise<IntegrationTestSuite> {
    const results = await this.runFullIntegrationTest();
    this.cachedResults = results;
    return results;
  }

  // Add the missing runQuickHealthCheck method
  async runQuickHealthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      console.log('🏥 Running quick health check...');
      
      // Quick database connectivity test
      const { error: dbError } = await supabase
        .from('vehicles')
        .select('count')
        .limit(1);
      
      if (dbError) {
        issues.push(`Database connectivity issue: ${dbError.message}`);
      }

      // Quick session validation
      try {
        const sessionInfo = await GP51SessionManager.validateSession();
        if (!sessionInfo.valid) {
          issues.push(`Session validation failed: ${sessionInfo.error || 'Unknown session error'}`);
        }
      } catch (error) {
        issues.push(`Session check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Quick vehicle data check
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id')
        .limit(5);

      if (vehicleError) {
        issues.push(`Vehicle data access failed: ${vehicleError.message}`);
      } else if (!vehicles || vehicles.length === 0) {
        issues.push('No vehicles found in database');
      }

      return {
        healthy: issues.length === 0,
        issues
      };

    } catch (error) {
      issues.push(`Health check exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        healthy: false,
        issues
      };
    }
  }

  // Add the missing getResults method
  getResults(): IntegrationTestSuite | null {
    return this.cachedResults;
  }

  async runFullIntegrationTest(): Promise<IntegrationTestSuite> {
    const startTime = Date.now();
    const results: IntegrationTestResult[] = [];

    console.log('🧪 Starting GP51 integration test suite...');

    // Test 1: Session validation
    results.push(await this.testSessionValidation());

    // Test 2: Database connectivity
    results.push(await this.testDatabaseConnectivity());

    // Test 3: Vehicle data access
    results.push(await this.testVehicleDataAccess());

    // Test 4: User data access
    results.push(await this.testUserDataAccess());

    const totalDuration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    const suite: IntegrationTestSuite = {
      suiteName: 'GP51 Integration Tests',
      results,
      overallSuccess: failed === 0,
      totalDuration,
      summary: {
        passed,
        failed,
        total: results.length
      }
    };

    console.log(`🧪 Integration tests completed. ${passed}/${results.length} passed in ${totalDuration}ms`);
    this.cachedResults = suite;
    return suite;
  }

  private async testSessionValidation(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('Testing GP51 session validation...');
      
      const sessionInfo = await GP51SessionManager.validateSession();
      const duration = Date.now() - startTime;

      if (sessionInfo.valid) {
        return {
          testName: 'GP51 Session Validation',
          success: true,
          message: 'Session validation successful',
          duration,
          details: { sessionValid: true }
        };
      } else {
        return {
          testName: 'GP51 Session Validation',
          success: false,
          message: sessionInfo.error || 'Session validation failed',
          duration,
          details: sessionInfo
        };
      }
    } catch (error) {
      return {
        testName: 'GP51 Session Validation',
        success: false,
        message: `Session validation exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testDatabaseConnectivity(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('Testing database connectivity...');
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('count')
        .limit(1);

      const duration = Date.now() - startTime;

      if (error) {
        return {
          testName: 'Database Connectivity',
          success: false,
          message: `Database error: ${error.message}`,
          duration
        };
      }

      return {
        testName: 'Database Connectivity',
        success: true,
        message: 'Database connection successful',
        duration,
        details: { queryResult: data }
      };
    } catch (error) {
      return {
        testName: 'Database Connectivity',
        success: false,
        message: `Database connectivity exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testVehicleDataAccess(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('Testing vehicle data access...');
      
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, updated_at')
        .limit(5);

      const duration = Date.now() - startTime;

      if (error) {
        return {
          testName: 'Vehicle Data Access',
          success: false,
          message: `Vehicle query error: ${error.message}`,
          duration
        };
      }

      if (!vehicles) {
        return {
          testName: 'Vehicle Data Access',
          success: true,
          message: 'No vehicles found, but query successful',
          duration,
          details: { vehicleCount: 0 }
        };
      }

      // Check data integrity
      const hasValidData = vehicles.every(v => v.id && v.gp51_device_id);
      
      return {
        testName: 'Vehicle Data Access',
        success: hasValidData,
        message: hasValidData 
          ? `Successfully accessed ${vehicles.length} vehicles`
          : 'Vehicle data integrity issues found',
        duration,
        details: { 
          vehicleCount: vehicles.length,
          sampleVehicle: vehicles[0]
        }
      };
    } catch (error) {
      return {
        testName: 'Vehicle Data Access',
        success: false,
        message: `Vehicle data access exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testUserDataAccess(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('Testing user data access...');
      
      const { data: users, error } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .limit(5);

      const duration = Date.now() - startTime;

      if (error) {
        return {
          testName: 'User Data Access',
          success: false,
          message: `User query error: ${error.message}`,
          duration
        };
      }

      if (!users) {
        return {
          testName: 'User Data Access',
          success: true,
          message: 'No users found, but query successful',
          duration,
          details: { userCount: 0 }
        };
      }

      // Check data integrity
      const hasValidData = users.every(u => u.id && u.email);
      
      return {
        testName: 'User Data Access',
        success: hasValidData,
        message: hasValidData 
          ? `Successfully accessed ${users.length} users`
          : 'User data integrity issues found',
        duration,
        details: { 
          userCount: users.length,
          sampleUser: { id: users[0]?.id, hasEmail: !!users[0]?.email }
        }
      };
    } catch (error) {
      return {
        testName: 'User Data Access',
        success: false,
        message: `User data access exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }
}

export const gp51IntegrationTester = new GP51IntegrationTester();
