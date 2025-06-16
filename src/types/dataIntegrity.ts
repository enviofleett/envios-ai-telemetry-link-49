
export interface ConsistencyCheck {
  checkType: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
}

export interface ConsistencyReport {
  timestamp: string;
  overallScore: number;
  checksPerformed: number;
  checksPassed: number;
  checksFailed: number;
  checks: ConsistencyCheck[];
  recommendations: string[];
  dataHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}
