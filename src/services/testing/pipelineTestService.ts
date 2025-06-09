
interface PipelineTestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string;
  timestamp: Date;
}

interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  gp51Connection: boolean;
  databaseConnection: boolean;
  syncPerformance: 'excellent' | 'good' | 'poor';
  dataFreshness: 'current' | 'stale' | 'offline';
  lastTestTime: Date;
}

export class PipelineTestService {
  private static instance: PipelineTestService;
  private testResults: PipelineTestResult[] = [];
  private healthStatus: SystemHealthStatus = {
    overall: 'healthy',
    gp51Connection: false,
    databaseConnection: false,
    syncPerformance: 'good',
    dataFreshness: 'offline',
    lastTestTime: new Date()
  };

  static getInstance(): PipelineTestService {
    if (!PipelineTestService.instance) {
      PipelineTestService.instance = new PipelineTestService();
    }
    return PipelineTestService.instance;
  }

  async runEndToEndTest(): Promise<PipelineTestResult[]> {
    console.log('🧪 Starting end-to-end pipeline test...');
    const testResults: PipelineTestResult[] = [];

    // Test 1: GP51 API Connectivity
    const gp51Test = await this.testGP51Connection();
    testResults.push(gp51Test);

    // Test 2: Database Operations
    const dbTest = await this.testDatabaseOperations();
    testResults.push(dbTest);

    // Test 3: Data Pipeline Flow
    const pipelineTest = await this.testDataPipelineFlow();
    testResults.push(pipelineTest);

    // Test 4: Frontend Data Display
    const frontendTest = await this.testFrontendDataDisplay();
    testResults.push(frontendTest);

    // Test 5: Real-time Performance
    const performanceTest = await this.testPerformanceMetrics();
    testResults.push(performanceTest);

    this.testResults = [...this.testResults, ...testResults].slice(-50); // Keep last 50 tests
    this.updateHealthStatus(testResults);

    console.log('✅ End-to-end pipeline test completed');
    return testResults;
  }

  private async testGP51Connection(): Promise<PipelineTestResult> {
    const startTime = Date.now();
    try {
      const { data, error } = await import('@/integrations/supabase/client').then(m => 
        m.supabase.functions.invoke('gp51-service-management', {
          body: { action: 'test_connection' }
        })
      );

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'GP51 connection failed');
      }

      return {
        testName: 'GP51 API Connection',
        success: true,
        duration: Date.now() - startTime,
        details: 'GP51 API accessible and responding',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        testName: 'GP51 API Connection',
        success: false,
        duration: Date.now() - startTime,
        details: `GP51 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async testDatabaseOperations(): Promise<PipelineTestResult> {
    const startTime = Date.now();
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Test database connectivity with a simple query
      const { data, error } = await supabase
        .from('vehicles')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return {
        testName: 'Database Operations',
        success: true,
        duration: Date.now() - startTime,
        details: 'Database queries executing successfully',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        testName: 'Database Operations',
        success: false,
        duration: Date.now() - startTime,
        details: `Database operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async testDataPipelineFlow(): Promise<PipelineTestResult> {
    const startTime = Date.now();
    try {
      // Import the sync service and trigger a test sync
      const { vehiclePositionSyncService } = await import('@/services/vehiclePosition/vehiclePositionSyncService');
      
      const syncResult = await vehiclePositionSyncService.forceSync();
      
      if (!syncResult.success && syncResult.errorCount > 0) {
        throw new Error(`Data pipeline sync failed: ${syncResult.message}`);
      }

      return {
        testName: 'Data Pipeline Flow',
        success: true,
        duration: Date.now() - startTime,
        details: `Pipeline sync completed: ${syncResult.updatedCount} vehicles updated`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        testName: 'Data Pipeline Flow',
        success: false,
        duration: Date.now() - startTime,
        details: `Data pipeline test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async testFrontendDataDisplay(): Promise<PipelineTestResult> {
    const startTime = Date.now();
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Check for recent vehicle position updates
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
      
      const { data: recentVehicles, error } = await supabase
        .from('vehicles')
        .select('device_id, last_position, updated_at')
        .gte('updated_at', thirtySecondsAgo)
        .limit(10);

      if (error) {
        throw new Error(`Frontend data query failed: ${error.message}`);
      }

      const recentCount = recentVehicles?.length || 0;
      
      return {
        testName: 'Frontend Data Display',
        success: recentCount > 0,
        duration: Date.now() - startTime,
        details: `${recentCount} vehicles with recent updates (last 30 seconds)`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        testName: 'Frontend Data Display',
        success: false,
        duration: Date.now() - startTime,
        details: `Frontend data test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private async testPerformanceMetrics(): Promise<PipelineTestResult> {
    const startTime = Date.now();
    try {
      const { liveDataMonitor } = await import('@/services/monitoring/liveDataMonitor');
      
      const metrics = liveDataMonitor.getMetrics();
      const successRate = liveDataMonitor.getSuccessRate();
      const dataQuality = liveDataMonitor.getDataQualityScore();

      const performanceGood = successRate > 0.8 && dataQuality > 75;
      
      return {
        testName: 'Performance Metrics',
        success: performanceGood,
        duration: Date.now() - startTime,
        details: `Success rate: ${(successRate * 100).toFixed(1)}%, Data quality: ${dataQuality.toFixed(1)}%`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        testName: 'Performance Metrics',
        success: false,
        duration: Date.now() - startTime,
        details: `Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  private updateHealthStatus(testResults: PipelineTestResult[]): void {
    const successCount = testResults.filter(t => t.success).length;
    const totalTests = testResults.length;
    const successRate = successCount / totalTests;

    // Update individual component status
    this.healthStatus.gp51Connection = testResults.find(t => t.testName === 'GP51 API Connection')?.success || false;
    this.healthStatus.databaseConnection = testResults.find(t => t.testName === 'Database Operations')?.success || false;
    
    // Update performance rating
    if (successRate >= 0.9) {
      this.healthStatus.syncPerformance = 'excellent';
    } else if (successRate >= 0.7) {
      this.healthStatus.syncPerformance = 'good';
    } else {
      this.healthStatus.syncPerformance = 'poor';
    }

    // Update data freshness
    const frontendTest = testResults.find(t => t.testName === 'Frontend Data Display');
    if (frontendTest?.success) {
      this.healthStatus.dataFreshness = 'current';
    } else if (this.healthStatus.gp51Connection) {
      this.healthStatus.dataFreshness = 'stale';
    } else {
      this.healthStatus.dataFreshness = 'offline';
    }

    // Update overall health
    if (successRate >= 0.8) {
      this.healthStatus.overall = 'healthy';
    } else if (successRate >= 0.5) {
      this.healthStatus.overall = 'degraded';
    } else {
      this.healthStatus.overall = 'critical';
    }

    this.healthStatus.lastTestTime = new Date();
  }

  getTestResults(): PipelineTestResult[] {
    return [...this.testResults];
  }

  getHealthStatus(): SystemHealthStatus {
    return { ...this.healthStatus };
  }

  async runContinuousMonitoring(): Promise<void> {
    // Run tests every 2 minutes
    setInterval(() => {
      this.runEndToEndTest().catch(error => {
        console.error('Continuous monitoring test failed:', error);
      });
    }, 2 * 60 * 1000);

    // Run initial test
    await this.runEndToEndTest();
  }
}

export const pipelineTestService = PipelineTestService.getInstance();
