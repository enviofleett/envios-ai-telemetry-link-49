
export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string; // Made required to match usage
  error?: string;
  timestamp: Date;
  suggestedFixes?: string[];
  message?: string; // Added for compatibility
}

export interface ValidationSuite {
  credentialSaving: TestResult[];
  sessionManagement: TestResult[];
  vehicleDataSync: TestResult[];
  errorRecovery: TestResult[];
  results: TestResult[]; // Added missing results property
  overall: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
  };
}
