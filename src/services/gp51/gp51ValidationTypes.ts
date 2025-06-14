
export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string;
  error?: string;
  timestamp: Date;
  suggestedFixes?: string[];
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
