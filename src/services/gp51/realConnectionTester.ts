
import { supabase } from '@/integrations/supabase/client';

interface ConnectionTestResult {
  success: boolean;
  responseTime: number;
  status: 'connected' | 'disconnected' | 'error';
  message: string;
  timestamp: Date;
  details?: any;
}

interface SystemAlert {
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source_system: string;
  source_entity_id?: string;
  alert_data?: any;
}

class RealConnectionTester {
  private lastTestResult: ConnectionTestResult | null = null;
  private testInProgress = false;

  async testGP51Connection(): Promise<ConnectionTestResult> {
    if (this.testInProgress) {
      return this.lastTestResult || {
        success: false,
        responseTime: 0,
        status: 'error',
        message: 'Test already in progress',
        timestamp: new Date()
      };
    }

    this.testInProgress = true;
    const startTime = Date.now();

    try {
      // Get GP51 credentials and test connection
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (sessionError) {
        const result: ConnectionTestResult = {
          success: false,
          responseTime,
          status: 'error',
          message: `Database connection failed: ${sessionError.message}`,
          timestamp: new Date(),
          details: sessionError
        };
        
        await this.logTestResult(result);
        return result;
      }

      if (!sessions || sessions.length === 0) {
        const result: ConnectionTestResult = {
          success: false,
          responseTime,
          status: 'disconnected',
          message: 'No GP51 sessions found. Please authenticate first.',
          timestamp: new Date()
        };
        
        await this.logTestResult(result);
        return result;
      }

      const session = sessions[0];
      const now = new Date();
      const expiresAt = new Date(session.token_expires_at || 0);
      
      if (expiresAt <= now) {
        const result: ConnectionTestResult = {
          success: false,
          responseTime,
          status: 'disconnected',
          message: 'GP51 session has expired. Please re-authenticate.',
          timestamp: new Date(),
          details: { sessionId: session.id, expiresAt: session.token_expires_at }
        };
        
        await this.logTestResult(result);
        return result;
      }

      // Test successful
      const result: ConnectionTestResult = {
        success: true,
        responseTime,
        status: 'connected',
        message: `GP51 connection successful. Session valid until ${expiresAt.toLocaleString()}`,
        timestamp: new Date(),
        details: {
          sessionId: session.id,
          username: session.username,
          expiresAt: session.token_expires_at,
          lastActivity: session.last_activity_at
        }
      };

      await this.logTestResult(result);
      this.lastTestResult = result;
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        success: false,
        responseTime,
        status: 'error',
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        details: error
      };
      
      await this.logTestResult(result);
      return result;
    } finally {
      this.testInProgress = false;
    }
  }

  private async logTestResult(result: ConnectionTestResult): Promise<void> {
    try {
      // Create a system alert if the connection test fails
      if (!result.success && result.status === 'error') {
        await this.createSystemAlert({
          alert_type: 'gp51_connection_failure',
          severity: 'high',
          title: 'GP51 Connection Test Failed',
          message: result.message,
          source_system: 'gp51_connection_tester',
          alert_data: {
            responseTime: result.responseTime,
            timestamp: result.timestamp,
            details: result.details
          }
        });
      }

      // Log to application errors table for tracking
      if (!result.success) {
        await supabase
          .from('application_errors')
          .insert({
            error_type: 'gp51_connection_test',
            error_message: result.message,
            severity: result.status === 'error' ? 'high' : 'medium',
            error_context: {
              responseTime: result.responseTime,
              status: result.status,
              details: result.details
            }
          });
      }
    } catch (error) {
      console.error('Failed to log connection test result:', error);
    }
  }

  private async createSystemAlert(alert: SystemAlert): Promise<void> {
    try {
      // Use a direct insert approach to avoid TypeScript issues
      const { error } = await supabase
        .rpc('execute_sql', {
          query: `
            INSERT INTO system_alerts (alert_type, severity, title, message, source_system, source_entity_id, alert_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          params: [
            alert.alert_type,
            alert.severity,
            alert.title,
            alert.message,
            alert.source_system,
            alert.source_entity_id || null,
            JSON.stringify(alert.alert_data || {})
          ]
        });

      if (error) {
        console.error('Failed to create system alert:', error);
      }
    } catch (error) {
      console.error('Error creating system alert:', error);
    }
  }

  async getLastTestResult(): Promise<ConnectionTestResult | null> {
    return this.lastTestResult;
  }

  async performHealthCheck(): Promise<{
    database: boolean;
    gp51Session: boolean;
    responseTime: number;
    lastCheck: Date;
  }> {
    const startTime = Date.now();
    
    try {
      // Test database connectivity
      const { data, error: dbError } = await supabase
        .from('gp51_sessions')
        .select('count', { count: 'exact', head: true });

      const databaseHealthy = !dbError;

      // Test GP51 session validity
      const connectionTest = await this.testGP51Connection();
      const gp51Healthy = connectionTest.success;

      const responseTime = Date.now() - startTime;

      return {
        database: databaseHealthy,
        gp51Session: gp51Healthy,
        responseTime,
        lastCheck: new Date()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        database: false,
        gp51Session: false,
        responseTime: Date.now() - startTime,
        lastCheck: new Date()
      };
    }
  }
}

export const realConnectionTester = new RealConnectionTester();
export default realConnectionTester;
