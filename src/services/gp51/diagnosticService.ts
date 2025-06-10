
import { DiagnosticResult } from './types';
import { GP51DiagnosticTests } from './diagnosticTests';
import { GP51DiagnosticLogger } from './diagnosticLogger';

export class GP51DiagnosticService {
  private static instance: GP51DiagnosticService;
  private tests: GP51DiagnosticTests;
  private logger: GP51DiagnosticLogger;

  constructor() {
    this.tests = new GP51DiagnosticTests();
    this.logger = new GP51DiagnosticLogger();
  }

  static getInstance(): GP51DiagnosticService {
    if (!GP51DiagnosticService.instance) {
      GP51DiagnosticService.instance = new GP51DiagnosticService();
    }
    return GP51DiagnosticService.instance;
  }

  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    const timestamp = new Date().toISOString();

    // Test 1: Check GP51 session availability
    const sessionResult = await this.tests.checkGP51Session(timestamp);
    results.push(sessionResult);

    // Test 2: Check vehicle data integrity
    const vehicleResult = await this.tests.checkVehicleDataIntegrity(timestamp);
    results.push(vehicleResult);

    // Test 3: Check recent sync activity
    const syncResult = await this.tests.checkRecentSyncActivity(timestamp);
    results.push(syncResult);

    // Test 4: Test GP51 API connectivity (if session available)
    const connectivityResult = await this.tests.checkGP51ApiConnectivity(
      timestamp, 
      sessionResult.status === 'pass'
    );
    results.push(connectivityResult);

    return results;
  }

  async logDiagnosticResults(results: DiagnosticResult[]): Promise<void> {
    return this.logger.logDiagnosticResults(results);
  }
}

export const gp51DiagnosticService = GP51DiagnosticService.getInstance();
