
export interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  duration: number;
  details?: any;
  timestamp: Date;
  error?: string;
  suggestedFixes?: string[];
}

export interface ValidationSuite {
  suiteName: string;
  results: TestResult[];
  overallSuccess: boolean;
  totalDuration: number;
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
  overall: {
    passedTests: number;
    totalTests: number;
    failedTests: number;
    successRate: number;
  };
  credentialSaving: TestResult[];
  sessionManagement: TestResult[];
  vehicleDataSync: TestResult[];
  errorRecovery: TestResult[];
}

export interface HealthCheckResult {
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
  };
  timestamp: Date;
  checks: {
    database: boolean;
    gp51Connection: boolean;
    dataSync: boolean;
  };
  metrics: {
    totalVehicles: number;
    activeVehicles: number;
    onlineVehicles: number;
    lastSyncTime?: Date;
    systemStatus: 'healthy' | 'warning' | 'critical';
    connectionStatus: 'connected' | 'disconnected' | 'error';
    dataFreshness: 'fresh' | 'stale' | 'expired';
    errors: string[];
  };
}

// Report types
export interface VehicleFilters {
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface Vehicle {
  id: string;
  gp51_device_id: string;
  name: string;
  user_id: string;
}

export interface ReportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface ReportData {
  summary: any;
  details: any[];
  charts?: any[];
}
