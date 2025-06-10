
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

export class GP51DiagnosticService {
  private static instance: GP51DiagnosticService;

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
    try {
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('is_active', true);

      if (error) {
        results.push({
          test: 'GP51 Session Check',
          status: 'fail',
          message: `Database error: ${error.message}`,
          timestamp
        });
      } else if (!sessions || sessions.length === 0) {
        results.push({
          test: 'GP51 Session Check',
          status: 'fail',
          message: 'No active GP51 sessions found',
          timestamp
        });
      } else {
        const session = sessions[0];
        const expiresAt = new Date(session.token_expires_at);
        const now = new Date();
        
        if (expiresAt < now) {
          results.push({
            test: 'GP51 Session Check',
            status: 'fail',
            message: `Session expired at ${expiresAt.toISOString()}`,
            details: session,
            timestamp
          });
        } else {
          results.push({
            test: 'GP51 Session Check',
            status: 'pass',
            message: `Active session found, expires at ${expiresAt.toISOString()}`,
            details: { username: session.gp51_username, expiresAt },
            timestamp
          });
        }
      }
    } catch (error) {
      results.push({
        test: 'GP51 Session Check',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp
      });
    }

    // Test 2: Check vehicle data integrity
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('device_id, last_position, updated_at')
        .limit(10);

      if (error) {
        results.push({
          test: 'Vehicle Data Integrity',
          status: 'fail',
          message: `Database error: ${error.message}`,
          timestamp
        });
      } else {
        let corruptedCount = 0;
        let validCount = 0;
        
        vehicles?.forEach(vehicle => {
          try {
            if (vehicle.last_position) {
              JSON.stringify(vehicle.last_position); // Test JSON serialization
            }
            validCount++;
          } catch (e) {
            corruptedCount++;
          }
        });

        if (corruptedCount > 0) {
          results.push({
            test: 'Vehicle Data Integrity',
            status: 'warning',
            message: `${corruptedCount} vehicles have corrupted JSON data out of ${vehicles?.length || 0} checked`,
            details: { valid: validCount, corrupted: corruptedCount, total: vehicles?.length || 0 },
            timestamp
          });
        } else {
          results.push({
            test: 'Vehicle Data Integrity',
            status: 'pass',
            message: `All ${validCount} vehicles have valid JSON data`,
            details: { valid: validCount, total: vehicles?.length || 0 },
            timestamp
          });
        }
      }
    } catch (error) {
      results.push({
        test: 'Vehicle Data Integrity',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp
      });
    }

    // Test 3: Check recent sync activity
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentVehicles, error } = await supabase
        .from('vehicles')
        .select('device_id, updated_at')
        .gte('updated_at', oneHourAgo);

      if (error) {
        results.push({
          test: 'Recent Sync Activity',
          status: 'fail',
          message: `Database error: ${error.message}`,
          timestamp
        });
      } else {
        const recentCount = recentVehicles?.length || 0;
        
        if (recentCount === 0) {
          results.push({
            test: 'Recent Sync Activity',
            status: 'warning',
            message: 'No vehicles updated in the last hour',
            details: { recentUpdates: 0, checkPeriod: '1 hour' },
            timestamp
          });
        } else {
          results.push({
            test: 'Recent Sync Activity',
            status: 'pass',
            message: `${recentCount} vehicles updated in the last hour`,
            details: { recentUpdates: recentCount, checkPeriod: '1 hour' },
            timestamp
          });
        }
      }
    } catch (error) {
      results.push({
        test: 'Recent Sync Activity',
        status: 'fail',
        message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp
      });
    }

    // Test 4: Test GP51 API connectivity (if session available)
    const sessionTest = results.find(r => r.test === 'GP51 Session Check');
    if (sessionTest?.status === 'pass') {
      try {
        const { data: session } = await supabase
          .from('gp51_sessions')
          .select('gp51_token')
          .eq('is_active', true)
          .single();

        if (session?.gp51_token) {
          const testResponse = await fetch('https://www.gps51.com/webapi?action=validate_token&token=' + session.gp51_token, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (testResponse.ok) {
            const data = await testResponse.json();
            if (data.status === 0) {
              results.push({
                test: 'GP51 API Connectivity',
                status: 'pass',
                message: 'GP51 API is accessible and token is valid',
                timestamp
              });
            } else {
              results.push({
                test: 'GP51 API Connectivity',
                status: 'fail',
                message: `GP51 API returned error: ${data.cause || 'Unknown error'}`,
                details: data,
                timestamp
              });
            }
          } else {
            results.push({
              test: 'GP51 API Connectivity',
              status: 'fail',
              message: `HTTP error: ${testResponse.status} ${testResponse.statusText}`,
              timestamp
            });
          }
        }
      } catch (error) {
        results.push({
          test: 'GP51 API Connectivity',
          status: 'fail',
          message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp
        });
      }
    } else {
      results.push({
        test: 'GP51 API Connectivity',
        status: 'fail',
        message: 'Skipped - no valid GP51 session available',
        timestamp
      });
    }

    return results;
  }

  async logDiagnosticResults(results: DiagnosticResult[]): Promise<void> {
    try {
      const summary = {
        total: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        warnings: results.filter(r => r.status === 'warning').length,
      };

      console.log('🔍 GP51 Diagnostic Results Summary:', summary);
      results.forEach(result => {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(`${icon} ${result.test}: ${result.message}`);
        if (result.details) {
          console.log('   Details:', result.details);
        }
      });

      // Store diagnostic results in database for historical tracking
      await supabase.from('gp51_health_metrics').insert({
        success: summary.failed === 0,
        latency: 0, // Not applicable for diagnostic
        error_details: summary.failed > 0 ? results.filter(r => r.status === 'fail').map(r => r.message).join('; ') : null
      });
    } catch (error) {
      console.error('Failed to log diagnostic results:', error);
    }
  }
}

export const gp51DiagnosticService = GP51DiagnosticService.getInstance();
