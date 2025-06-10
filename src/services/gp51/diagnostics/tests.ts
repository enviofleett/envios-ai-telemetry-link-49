
import { DiagnosticResult, DiagnosticTestOptions } from './types';
import { 
  getActiveGP51Sessions, 
  getVehicleDataSample, 
  getRecentVehicleUpdates,
  getGP51SessionToken 
} from './queries';

export class GP51DiagnosticTests {
  async checkGP51Session(options: DiagnosticTestOptions): Promise<DiagnosticResult> {
    try {
      const { data: sessionData, error } = await getActiveGP51Sessions();

      if (error) {
        return {
          test: 'GP51 Session Check',
          status: 'fail',
          message: `Database error: ${error.message || 'Unknown error'}`,
          timestamp: options.timestamp
        };
      }

      if (!sessionData || sessionData.length === 0) {
        return {
          test: 'GP51 Session Check',
          status: 'fail',
          message: 'No active GP51 sessions found',
          timestamp: options.timestamp
        };
      }

      const session = sessionData[0];
      if (!session.token_expires_at) {
        return {
          test: 'GP51 Session Check',
          status: 'warning',
          message: 'Session found but no expiration time available',
          details: { username: session.username },
          timestamp: options.timestamp
        };
      }

      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();
      
      if (expiresAt < now) {
        return {
          test: 'GP51 Session Check',
          status: 'fail',
          message: `Session expired at ${expiresAt.toISOString()}`,
          details: { username: session.username, expiresAt: expiresAt.toISOString() },
          timestamp: options.timestamp
        };
      }

      return {
        test: 'GP51 Session Check',
        status: 'pass',
        message: `Active session found, expires at ${expiresAt.toISOString()}`,
        details: { username: session.username, expiresAt: expiresAt.toISOString() },
        timestamp: options.timestamp
      };
    } catch (error) {
      return {
        test: 'GP51 Session Check',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: options.timestamp
      };
    }
  }

  async checkVehicleDataIntegrity(options: DiagnosticTestOptions): Promise<DiagnosticResult> {
    try {
      const { data: vehicles, error } = await getVehicleDataSample();

      if (error) {
        return {
          test: 'Vehicle Data Integrity',
          status: 'fail',
          message: `Database error: ${error.message || 'Unknown error'}`,
          timestamp: options.timestamp
        };
      }

      let corruptedCount = 0;
      let validCount = 0;
      
      for (const vehicle of vehicles) {
        try {
          if (vehicle.last_position) {
            JSON.stringify(vehicle.last_position);
          }
          validCount++;
        } catch (jsonError) {
          corruptedCount++;
        }
      }

      if (corruptedCount > 0) {
        return {
          test: 'Vehicle Data Integrity',
          status: 'warning',
          message: `${corruptedCount} vehicles have corrupted JSON data out of ${vehicles.length} checked`,
          details: { valid: validCount, corrupted: corruptedCount, total: vehicles.length },
          timestamp: options.timestamp
        };
      }

      return {
        test: 'Vehicle Data Integrity',
        status: 'pass',
        message: `All ${validCount} vehicles have valid JSON data`,
        details: { valid: validCount, total: vehicles.length },
        timestamp: options.timestamp
      };
    } catch (error) {
      return {
        test: 'Vehicle Data Integrity',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: options.timestamp
      };
    }
  }

  async checkRecentSyncActivity(options: DiagnosticTestOptions): Promise<DiagnosticResult> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentVehicles, error } = await getRecentVehicleUpdates(oneHourAgo);

      if (error) {
        return {
          test: 'Recent Sync Activity',
          status: 'fail',
          message: `Database error: ${error.message || 'Unknown error'}`,
          timestamp: options.timestamp
        };
      }

      const recentCount = recentVehicles.length;
      
      if (recentCount === 0) {
        return {
          test: 'Recent Sync Activity',
          status: 'warning',
          message: 'No vehicles updated in the last hour',
          details: { recentUpdates: 0, checkPeriod: '1 hour' },
          timestamp: options.timestamp
        };
      }

      return {
        test: 'Recent Sync Activity',
        status: 'pass',
        message: `${recentCount} vehicles updated in the last hour`,
        details: { recentUpdates: recentCount, checkPeriod: '1 hour' },
        timestamp: options.timestamp
      };
    } catch (error) {
      return {
        test: 'Recent Sync Activity',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: options.timestamp
      };
    }
  }

  async checkGP51ApiConnectivity(options: DiagnosticTestOptions, sessionValid: boolean): Promise<DiagnosticResult> {
    if (!sessionValid) {
      return {
        test: 'GP51 API Connectivity',
        status: 'fail',
        message: 'Skipped - no valid GP51 session available',
        timestamp: options.timestamp
      };
    }

    try {
      const { data: sessionData, error } = await getGP51SessionToken();

      if (error) {
        return {
          test: 'GP51 API Connectivity',
          status: 'fail',
          message: `Database error: ${error.message || 'Unknown error'}`,
          timestamp: options.timestamp
        };
      }

      if (!sessionData || !sessionData.gp51_token) {
        return {
          test: 'GP51 API Connectivity',
          status: 'fail',
          message: 'No valid token available',
          timestamp: options.timestamp
        };
      }

      const testResponse = await fetch(`https://www.gps51.com/webapi?action=validate_token&token=${sessionData.gp51_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!testResponse.ok) {
        return {
          test: 'GP51 API Connectivity',
          status: 'fail',
          message: `HTTP error: ${testResponse.status} ${testResponse.statusText}`,
          timestamp: options.timestamp
        };
      }

      const data = await testResponse.json();
      if (data.status === 0) {
        return {
          test: 'GP51 API Connectivity',
          status: 'pass',
          message: 'GP51 API is accessible and token is valid',
          timestamp: options.timestamp
        };
      } else {
        return {
          test: 'GP51 API Connectivity',
          status: 'fail',
          message: `GP51 API returned error: ${data.cause || 'Unknown error'}`,
          details: { response: data },
          timestamp: options.timestamp
        };
      }
    } catch (error) {
      return {
        test: 'GP51 API Connectivity',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: options.timestamp
      };
    }
  }
}
