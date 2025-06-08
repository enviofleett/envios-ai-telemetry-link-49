
export interface ConsistencyCheck {
  id: string;
  name: string;
  description: string;
  query: string;
  expectedResult: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'referential' | 'business_logic' | 'data_quality' | 'security';
}

export interface ConsistencyReport {
  timestamp: Date;
  checksPerformed: number;
  checksPassed: number;
  checksFailed: number;
  overallScore: number;
  dataHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  failedChecks: ConsistencyCheckResult[];
  recommendations: string[];
}

export interface ConsistencyCheckResult {
  check: ConsistencyCheck;
  passed: boolean;
  actualResult: any;
  expectedResult: any;
  message: string;
  impact: string;
}

export class DataConsistencyVerifier {
  private static instance: DataConsistencyVerifier;
  private consistencyChecks: ConsistencyCheck[] = [];

  static getInstance(): DataConsistencyVerifier {
    if (!DataConsistencyVerifier.instance) {
      DataConsistencyVerifier.instance = new DataConsistencyVerifier();
      DataConsistencyVerifier.instance.initializeChecks();
    }
    return DataConsistencyVerifier.instance;
  }

  private initializeChecks(): void {
    this.consistencyChecks = [
      {
        id: 'orphaned_vehicles',
        name: 'Orphaned Vehicles Check',
        description: 'Verify no vehicles exist without valid user assignments',
        query: 'SELECT COUNT(*) as count FROM vehicles v LEFT JOIN envio_users u ON v.envio_user_id = u.id WHERE v.envio_user_id IS NOT NULL AND u.id IS NULL',
        expectedResult: { count: 0 },
        severity: 'high',
        category: 'referential'
      },
      {
        id: 'duplicate_device_ids',
        name: 'Duplicate Device IDs Check',
        description: 'Ensure no duplicate device IDs exist in the system',
        query: 'SELECT device_id, COUNT(*) as count FROM vehicles GROUP BY device_id HAVING COUNT(*) > 1',
        expectedResult: [],
        severity: 'critical',
        category: 'data_quality'
      },
      {
        id: 'invalid_gp51_sessions',
        name: 'Invalid GP51 Sessions Check',
        description: 'Check for expired or malformed GP51 sessions',
        query: 'SELECT COUNT(*) as count FROM gp51_sessions WHERE token_expires_at < NOW()',
        expectedResult: { count: 0 },
        severity: 'medium',
        category: 'security'
      },
      {
        id: 'user_email_duplicates',
        name: 'Duplicate User Emails Check',
        description: 'Ensure no duplicate email addresses exist',
        query: 'SELECT email, COUNT(*) as count FROM envio_users GROUP BY email HAVING COUNT(*) > 1',
        expectedResult: [],
        severity: 'critical',
        category: 'data_quality'
      },
      {
        id: 'vehicle_status_consistency',
        name: 'Vehicle Status Consistency Check',
        description: 'Verify vehicle status matches last position data',
        query: 'SELECT COUNT(*) as count FROM vehicles WHERE status != (last_position->>"status")',
        expectedResult: { count: 0 },
        severity: 'medium',
        category: 'business_logic'
      }
    ];
  }

  async performFullConsistencyCheck(): Promise<ConsistencyReport> {
    console.log('Starting full data consistency check...');
    
    const results: ConsistencyCheckResult[] = [];
    let checksPassed = 0;
    let checksFailed = 0;

    for (const check of this.consistencyChecks) {
      try {
        const result = await this.executeCheck(check);
        results.push(result);
        
        if (result.passed) {
          checksPassed++;
        } else {
          checksFailed++;
        }
      } catch (error) {
        console.error(`Failed to execute check ${check.id}:`, error);
        results.push({
          check,
          passed: false,
          actualResult: null,
          expectedResult: check.expectedResult,
          message: `Check execution failed: ${error.message}`,
          impact: 'Unable to verify data consistency for this check'
        });
        checksFailed++;
      }
    }

    const overallScore = Math.round((checksPassed / this.consistencyChecks.length) * 100);
    const dataHealth = this.calculateDataHealth(overallScore, results);
    const recommendations = this.generateRecommendations(results);
    const failedChecks = results.filter(r => !r.passed);

    const report: ConsistencyReport = {
      timestamp: new Date(),
      checksPerformed: this.consistencyChecks.length,
      checksPassed,
      checksFailed,
      overallScore,
      dataHealth,
      failedChecks,
      recommendations
    };

    // Log the report for audit purposes
    console.log('Data consistency check completed:', {
      score: overallScore,
      health: dataHealth,
      failedChecks: checksFailed
    });

    return report;
  }

  private async executeCheck(check: ConsistencyCheck): Promise<ConsistencyCheckResult> {
    // In a real implementation, this would execute the SQL query against the database
    // For now, we'll simulate the checks with mock data
    console.log(`Executing check: ${check.name}`);
    
    // Mock implementation - in production this would use supabase client
    const mockResults = {
      orphaned_vehicles: { count: 0 },
      duplicate_device_ids: [],
      invalid_gp51_sessions: { count: 2 },
      user_email_duplicates: [],
      vehicle_status_consistency: { count: 1 }
    };

    const actualResult = mockResults[check.id as keyof typeof mockResults] || check.expectedResult;
    const passed = JSON.stringify(actualResult) === JSON.stringify(check.expectedResult);

    return {
      check,
      passed,
      actualResult,
      expectedResult: check.expectedResult,
      message: passed ? 'Check passed successfully' : `Data inconsistency detected`,
      impact: passed ? 'No impact' : this.getImpactMessage(check)
    };
  }

  private calculateDataHealth(score: number, results: ConsistencyCheckResult[]): ConsistencyReport['dataHealth'] {
    const criticalFailures = results.filter(r => !r.passed && r.check.severity === 'critical').length;
    const highFailures = results.filter(r => !r.passed && r.check.severity === 'high').length;

    if (criticalFailures > 0) return 'critical';
    if (highFailures > 1 || score < 60) return 'poor';
    if (highFailures > 0 || score < 80) return 'fair';
    if (score < 95) return 'good';
    return 'excellent';
  }

  private generateRecommendations(results: ConsistencyCheckResult[]): string[] {
    const recommendations: string[] = [];
    
    results.filter(r => !r.passed).forEach(result => {
      switch (result.check.category) {
        case 'referential':
          recommendations.push(`Fix referential integrity issues in ${result.check.name.toLowerCase()}`);
          break;
        case 'data_quality':
          recommendations.push(`Clean up data quality issues: ${result.check.description.toLowerCase()}`);
          break;
        case 'security':
          recommendations.push(`Address security concern: ${result.check.description.toLowerCase()}`);
          break;
        case 'business_logic':
          recommendations.push(`Review business logic: ${result.check.description.toLowerCase()}`);
          break;
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Data integrity is excellent. Continue regular monitoring.');
    }

    return recommendations;
  }

  private getImpactMessage(check: ConsistencyCheck): string {
    const impacts = {
      orphaned_vehicles: 'Vehicles may not be properly tracked or accessible to users',
      duplicate_device_ids: 'System may have conflicting device data and tracking issues',
      invalid_gp51_sessions: 'GP51 integration may fail or use expired credentials',
      user_email_duplicates: 'User authentication and communication may be affected',
      vehicle_status_consistency: 'Vehicle status display may be inaccurate'
    };

    return impacts[check.id as keyof typeof impacts] || 'Data inconsistency detected';
  }

  getAvailableChecks(): ConsistencyCheck[] {
    return [...this.consistencyChecks];
  }

  async executeSpecificChecks(checkIds: string[]): Promise<ConsistencyCheckResult[]> {
    const checksToRun = this.consistencyChecks.filter(check => checkIds.includes(check.id));
    const results: ConsistencyCheckResult[] = [];

    for (const check of checksToRun) {
      const result = await this.executeCheck(check);
      results.push(result);
    }

    return results;
  }
}

export const dataConsistencyVerifier = DataConsistencyVerifier.getInstance();
