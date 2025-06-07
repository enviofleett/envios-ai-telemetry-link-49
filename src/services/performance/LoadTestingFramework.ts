
export interface LoadTestConfig {
  targetUrl: string;
  concurrentUsers: number;
  duration: number; // in seconds
  requestsPerSecond: number;
  testType: 'load' | 'stress' | 'spike' | 'endurance';
  scenarios: LoadTestScenario[];
}

export interface LoadTestScenario {
  name: string;
  weight: number; // percentage of traffic
  requests: RequestConfig[];
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatusCode?: number;
  timeout?: number;
}

export interface LoadTestResult {
  testId: string;
  config: LoadTestConfig;
  startTime: Date;
  endTime: Date;
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
  metrics: LoadTestMetric[];
  errors: LoadTestError[];
  recommendations: string[];
}

export interface LoadTestMetric {
  timestamp: number;
  responseTime: number;
  statusCode: number;
  success: boolean;
  endpoint: string;
  scenario: string;
}

export interface LoadTestError {
  timestamp: number;
  endpoint: string;
  error: string;
  statusCode?: number;
  scenario: string;
}

export class LoadTestingFramework {
  private static instance: LoadTestingFramework;
  private runningTests = new Map<string, AbortController>();

  static getInstance(): LoadTestingFramework {
    if (!LoadTestingFramework.instance) {
      LoadTestingFramework.instance = new LoadTestingFramework();
    }
    return LoadTestingFramework.instance;
  }

  public async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const testId = this.generateTestId();
    const abortController = new AbortController();
    this.runningTests.set(testId, abortController);

    console.log(`Starting load test ${testId} with ${config.concurrentUsers} concurrent users`);

    const result: LoadTestResult = {
      testId,
      config,
      startTime: new Date(),
      endTime: new Date(),
      summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0
      },
      metrics: [],
      errors: [],
      recommendations: []
    };

    try {
      await this.executeLoadTest(config, result, abortController.signal);
    } catch (error) {
      console.error('Load test failed:', error);
      result.errors.push({
        timestamp: Date.now(),
        endpoint: 'test_framework',
        error: error instanceof Error ? error.message : 'Unknown error',
        scenario: 'framework'
      });
    } finally {
      result.endTime = new Date();
      this.calculateSummary(result);
      this.generateRecommendations(result);
      this.runningTests.delete(testId);
    }

    return result;
  }

  private async executeLoadTest(
    config: LoadTestConfig,
    result: LoadTestResult,
    signal: AbortSignal
  ): Promise<void> {
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    const userTasks: Promise<void>[] = [];

    // Create concurrent user simulations
    for (let i = 0; i < config.concurrentUsers; i++) {
      userTasks.push(this.simulateUser(config, result, signal, startTime, endTime));
    }

    // Wait for all users to complete or test duration to end
    await Promise.all(userTasks);
  }

  private async simulateUser(
    config: LoadTestConfig,
    result: LoadTestResult,
    signal: AbortSignal,
    startTime: number,
    endTime: number
  ): Promise<void> {
    while (Date.now() < endTime && !signal.aborted) {
      const scenario = this.selectScenario(config.scenarios);
      
      for (const request of scenario.requests) {
        if (Date.now() >= endTime || signal.aborted) break;

        await this.executeRequest(request, scenario.name, result, config.targetUrl);
        
        // Add delay to control request rate
        const delayMs = 1000 / config.requestsPerSecond;
        await this.delay(delayMs);
      }
    }
  }

  private selectScenario(scenarios: LoadTestScenario[]): LoadTestScenario {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const scenario of scenarios) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        return scenario;
      }
    }

    return scenarios[0]; // Fallback
  }

  private async executeRequest(
    request: RequestConfig,
    scenarioName: string,
    result: LoadTestResult,
    baseUrl: string
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${baseUrl}${request.endpoint}`, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: AbortSignal.timeout(request.timeout || 30000)
      });

      const responseTime = Date.now() - startTime;
      const success = request.expectedStatusCode 
        ? response.status === request.expectedStatusCode
        : response.ok;

      const metric: LoadTestMetric = {
        timestamp: startTime,
        responseTime,
        statusCode: response.status,
        success,
        endpoint: request.endpoint,
        scenario: scenarioName
      };

      result.metrics.push(metric);

      if (!success) {
        result.errors.push({
          timestamp: startTime,
          endpoint: request.endpoint,
          error: `Unexpected status code: ${response.status}`,
          statusCode: response.status,
          scenario: scenarioName
        });
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      result.metrics.push({
        timestamp: startTime,
        responseTime,
        statusCode: 0,
        success: false,
        endpoint: request.endpoint,
        scenario: scenarioName
      });

      result.errors.push({
        timestamp: startTime,
        endpoint: request.endpoint,
        error: error instanceof Error ? error.message : 'Request failed',
        scenario: scenarioName
      });
    }
  }

  private calculateSummary(result: LoadTestResult): void {
    const metrics = result.metrics;
    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = metrics.map(m => m.responseTime);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    
    const duration = (result.endTime.getTime() - result.startTime.getTime()) / 1000;
    const requestsPerSecond = totalRequests / duration;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

    result.summary = {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      errorRate
    };
  }

  private generateRecommendations(result: LoadTestResult): void {
    const recommendations: string[] = [];
    const summary = result.summary;

    // Response time recommendations
    if (summary.averageResponseTime > 2000) {
      recommendations.push('Average response time is high (>2s). Consider optimizing database queries and implementing caching.');
    }

    if (summary.maxResponseTime > 10000) {
      recommendations.push('Maximum response time is very high (>10s). Review slowest endpoints and implement timeouts.');
    }

    // Error rate recommendations
    if (summary.errorRate > 5) {
      recommendations.push('High error rate detected (>5%). Review error logs and implement better error handling.');
    }

    // Throughput recommendations
    if (summary.requestsPerSecond < result.config.requestsPerSecond * 0.8) {
      recommendations.push('Target throughput not achieved. Consider scaling infrastructure or optimizing application performance.');
    }

    // Memory and resource recommendations
    const uniqueErrors = new Set(result.errors.map(e => e.error));
    if (uniqueErrors.has('Request timeout')) {
      recommendations.push('Request timeouts detected. Consider increasing timeout values or optimizing server response times.');
    }

    if (uniqueErrors.size > 10) {
      recommendations.push('Multiple types of errors detected. Implement comprehensive error monitoring and handling.');
    }

    result.recommendations = recommendations;
  }

  public async runCapacityTest(baseConfig: LoadTestConfig): Promise<{
    maxConcurrentUsers: number;
    breakingPoint: LoadTestResult;
    recommendations: string[];
  }> {
    console.log('Starting capacity planning test...');
    
    let currentUsers = baseConfig.concurrentUsers;
    let lastSuccessfulTest: LoadTestResult | null = null;
    let breakingPoint: LoadTestResult | null = null;

    // Gradually increase load until breaking point
    while (currentUsers <= baseConfig.concurrentUsers * 10) {
      const testConfig = {
        ...baseConfig,
        concurrentUsers: currentUsers,
        duration: 60 // Shorter duration for capacity testing
      };

      const result = await this.runLoadTest(testConfig);
      
      // Check if system is still performing within acceptable limits
      if (result.summary.errorRate > 10 || result.summary.averageResponseTime > 5000) {
        breakingPoint = result;
        break;
      }

      lastSuccessfulTest = result;
      currentUsers = Math.floor(currentUsers * 1.5); // Increase by 50%
      
      // Brief pause between tests
      await this.delay(5000);
    }

    const maxConcurrentUsers = lastSuccessfulTest?.config.concurrentUsers || baseConfig.concurrentUsers;
    
    const recommendations = [
      `System can handle up to ${maxConcurrentUsers} concurrent users effectively.`,
      `Consider implementing auto-scaling at ${Math.floor(maxConcurrentUsers * 0.8)} concurrent users.`,
      'Monitor response times and error rates during peak usage.',
      'Implement circuit breakers and graceful degradation for overload scenarios.'
    ];

    return {
      maxConcurrentUsers,
      breakingPoint: breakingPoint || lastSuccessfulTest!,
      recommendations
    };
  }

  public stopLoadTest(testId: string): boolean {
    const controller = this.runningTests.get(testId);
    if (controller) {
      controller.abort();
      this.runningTests.delete(testId);
      return true;
    }
    return false;
  }

  public getRunningTests(): string[] {
    return Array.from(this.runningTests.keys());
  }

  private generateTestId(): string {
    return `loadtest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Predefined test scenarios for GP51 system
  public createGP51LoadTestConfig(): LoadTestConfig {
    return {
      targetUrl: window.location.origin,
      concurrentUsers: 10,
      duration: 300, // 5 minutes
      requestsPerSecond: 5,
      testType: 'load',
      scenarios: [
        {
          name: 'dashboard_access',
          weight: 40,
          requests: [
            {
              method: 'GET',
              endpoint: '/api/vehicles',
              expectedStatusCode: 200
            },
            {
              method: 'GET',
              endpoint: '/api/system-health',
              expectedStatusCode: 200
            }
          ]
        },
        {
          name: 'vehicle_tracking',
          weight: 35,
          requests: [
            {
              method: 'GET',
              endpoint: '/api/vehicles/positions',
              expectedStatusCode: 200
            },
            {
              method: 'GET',
              endpoint: '/api/vehicles/1234/history',
              expectedStatusCode: 200
            }
          ]
        },
        {
          name: 'gp51_sync',
          weight: 25,
          requests: [
            {
              method: 'POST',
              endpoint: '/api/gp51/sync',
              body: { force: false },
              expectedStatusCode: 200,
              timeout: 10000
            }
          ]
        }
      ]
    };
  }
}

export const loadTestingFramework = LoadTestingFramework.getInstance();
