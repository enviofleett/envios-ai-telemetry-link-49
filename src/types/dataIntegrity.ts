
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

export interface DataIntegrityIssue {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
  count?: number;
  details?: any;
}

export interface DataIntegrityReport {
  timestamp: string;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
  overallScore: number;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  issues: DataIntegrityIssue[];
  recommendations: string[];
  checks: ConsistencyCheck[];
}
