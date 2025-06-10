
import { supabase } from '@/integrations/supabase/client';
import { DiagnosticResult, GP51Session, VehicleData } from './types';

export class GP51DiagnosticTests {
  async checkGP51Session(timestamp: string): Promise<DiagnosticResult> {
    try {
      const response = await supabase
        .from('gp51_sessions')
        .select('gp51_token, token_expires_at, username')
        .eq('is_active', true);

      const { data: sessionData, error } = response as any;

      if (error) {
        return {
          test: 'GP51 Session Check',
          status: 'fail',
          message: `Database error: ${error.message}`,
          timestamp
        };
      }

      if (!sessionData || sessionData.length === 0) {
        return {
          test: 'GP51 Session Check',
          status: 'fail',
          message: 'No active GP51 sessions found',
          timestamp
        };
      }

      const session = sessionData[0] as GP51Session;
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();
      
      if (expiresAt < now) {
        return {
          test: 'GP51 Session Check',
          status: 'fail',
          message: `Session expired at ${expiresAt.toISOString()}`,
          details: session,
          timestamp
        };
      }

      return {
        test: 'GP51 Session Check',
        status: 'pass',
        message: `Active session found, expires at ${expiresAt.toISOString()}`,
        details: { username: session.username, expiresAt },
        timestamp
      };
    } catch (error) {
      return {
        test: 'GP51 Session Check',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp
      };
    }
  }

  async checkVehicleDataIntegrity(timestamp: string): Promise<DiagnosticResult> {
    try {
      const response = await supabase
        .from('vehicles')
        .select('device_id, last_position, updated_at')
        .limit(10);

      const { data: vehicles, error: vehicleError } = response as any;

      if (vehicleError) {
        return {
          test: 'Vehicle Data Integrity',
          status: 'fail',
          message: `Database error: ${vehicleError.message}`,
          timestamp
        };
      }

      let corruptedCount = 0;
      let validCount = 0;
      
      vehicles?.forEach((vehicle: any) => {
        try {
          if (vehicle.last_position) {
            JSON.stringify(vehicle.last_position);
          }
          validCount++;
        } catch (e) {
          corruptedCount++;
        }
      });

      if (corruptedCount > 0) {
        return {
          test: 'Vehicle Data Integrity',
          status: 'warning',
          message: `${corruptedCount} vehicles have corrupted JSON data out of ${vehicles?.length || 0} checked`,
          details: { valid: validCount, corrupted: corruptedCount, total: vehicles?.length || 0 },
          timestamp
        };
      }

      return {
        test: 'Vehicle Data Integrity',
        status: 'pass',
        message: `All ${validCount} vehicles have valid JSON data`,
        details: { valid: validCount, total: vehicles?.length || 0 },
        timestamp
      };
    } catch (error) {
      return {
        test: 'Vehicle Data Integrity',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp
      };
    }
  }

  async checkRecentSyncActivity(timestamp: string): Promise<DiagnosticResult> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const response = await supabase
        .from('vehicles')
        .select('device_id, updated_at')
        .gte('updated_at', oneHourAgo);

      const { data: recentVehicles, error: recentError } = response as any;

      if (recentError) {
        return {
          test: 'Recent Sync Activity',
          status: 'fail',
          message: `Database error: ${recentError.message}`,
          timestamp
        };
      }

      const recentCount = recentVehicles?.length || 0;
      
      if (recentCount === 0) {
        return {
          test: 'Recent Sync Activity',
          status: 'warning',
          message: 'No vehicles updated in the last hour',
          details: { recentUpdates: 0, checkPeriod: '1 hour' },
          timestamp
        };
      }

      return {
        test: 'Recent Sync Activity',
        status: 'pass',
        message: `${recentCount} vehicles updated in the last hour`,
        details: { recentUpdates: recentCount, checkPeriod: '1 hour' },
        timestamp
      };
    } catch (error) {
      return {
        test: 'Recent Sync Activity',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp
      };
    }
  }

  async checkGP51ApiConnectivity(timestamp: string, sessionValid: boolean): Promise<DiagnosticResult> {
    if (!sessionValid) {
      return {
        test: 'GP51 API Connectivity',
        status: 'fail',
        message: 'Skipped - no valid GP51 session available',
        timestamp
      };
    }

    try {
      const response = await supabase
        .from('gp51_sessions')
        .select('gp51_token')
        .eq('is_active', true)
        .single();

      const { data: sessionData } = response as any;

      if (sessionData?.gp51_token) {
        const testResponse = await fetch('https://www.gps51.com/webapi?action=validate_token&token=' + sessionData.gp51_token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (testResponse.ok) {
          const data = await testResponse.json();
          if (data.status === 0) {
            return {
              test: 'GP51 API Connectivity',
              status: 'pass',
              message: 'GP51 API is accessible and token is valid',
              timestamp
            };
          } else {
            return {
              test: 'GP51 API Connectivity',
              status: 'fail',
              message: `GP51 API returned error: ${data.cause || 'Unknown error'}`,
              details: data,
              timestamp
            };
          }
        } else {
          return {
            test: 'GP51 API Connectivity',
            status: 'fail',
            message: `HTTP error: ${testResponse.status} ${testResponse.statusText}`,
            timestamp
          };
        }
      }

      return {
        test: 'GP51 API Connectivity',
        status: 'fail',
        message: 'No valid token available',
        timestamp
      };
    } catch (error) {
      return {
        test: 'GP51 API Connectivity',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp
      };
    }
  }
}
