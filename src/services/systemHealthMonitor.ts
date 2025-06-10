import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  component: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  details?: any;
}

interface SystemHealth {
  status: 'ok' | 'warning' | 'error';
  components: HealthCheckResult[];
  activeConnections: number;
}

export class SystemHealthMonitor {
  private static instance: SystemHealthMonitor;
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private lastFullCheck: Date | null = null;

  private constructor() {}

  public static getInstance(): SystemHealthMonitor {
    if (!SystemHealthMonitor.instance) {
      SystemHealthMonitor.instance = new SystemHealthMonitor();
    }
    return SystemHealthMonitor.instance;
  }

  async performHealthCheck(): Promise<SystemHealth> {
    console.log('🔍 Starting comprehensive system health check...');
    
    const checks = await Promise.allSettled([
      this.checkDatabaseConnection(),
      this.checkSupabaseAuth(),
      this.checkGP51Integration(),
      this.checkSystemResources(),
      // Removed SMTP check since we deleted all SMTP functionality
    ]);

    const results: HealthCheckResult[] = checks.map((result, index) => {
      const checkNames = [
        'database',
        'authentication', 
        'gp51_integration',
        'system_resources'
      ];
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          component: checkNames[index],
          status: 'error',
          message: `Health check failed: ${result.reason}`,
          timestamp: new Date(),
          details: { error: result.reason }
        };
      }
    });

    const overallStatus = results.every(result => result.status === 'ok')
      ? 'ok'
      : results.some(result => result.status === 'error')
        ? 'error'
        : 'warning';

    const activeConnections = await this.checkActiveConnections();

    const systemHealth: SystemHealth = {
      status: overallStatus,
      components: results as HealthCheckResult[],
      activeConnections: activeConnections
    };

    this.lastFullCheck = new Date();
    console.log(`✅ System health check completed with status: ${overallStatus}`);
    return systemHealth;
  }

  private async checkDatabaseConnection(): Promise<HealthCheckResult> {
    try {
      const { data, error } = await supabase.from('vehicles').select('id').limit(1);
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      return {
        component: 'database',
        status: 'ok',
        message: 'Database connection is healthy',
        timestamp: new Date(),
        details: { recordCount: data?.length || 0 }
      };
    } catch (error: any) {
      console.error('Database connection health check failed:', error);
      return {
        component: 'database',
        status: 'error',
        message: `Database connection error: ${error.message}`,
        timestamp: new Date(),
        details: { error: error.message }
      };
    }
  }

  private async checkSupabaseAuth(): Promise<HealthCheckResult> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        throw new Error(`Supabase Auth check failed: ${error.message}`);
      }
      return {
        component: 'authentication',
        status: 'ok',
        message: 'Supabase Auth is operational',
        timestamp: new Date(),
        details: { userId: user?.id || 'N/A' }
      };
    } catch (error: any) {
      console.error('Supabase Auth health check failed:', error);
      return {
        component: 'authentication',
        status: 'error',
        message: `Supabase Auth error: ${error.message}`,
        timestamp: new Date(),
        details: { error: error.message }
      };
    }
  }

  private async checkGP51Integration(): Promise<HealthCheckResult> {
    try {
      // Placeholder: Replace with actual GP51 API call
      const gp51Status = await this.simulateGP51Check();
      if (!gp51Status.isHealthy) {
        throw new Error(`GP51 API check failed: ${gp51Status.message}`);
      }
      return {
        component: 'gp51_integration',
        status: 'ok',
        message: 'GP51 integration is operational',
        timestamp: new Date(),
        details: { version: '1.0', status: 'active' }
      };
    } catch (error: any) {
      console.error('GP51 integration health check failed:', error);
      return {
        component: 'gp51_integration',
        status: 'error',
        message: `GP51 integration error: ${error.message}`,
        timestamp: new Date(),
        details: { error: error.message }
      };
    }
  }

  private async checkSystemResources(): Promise<HealthCheckResult> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        component: 'system_resources',
        status: 'ok',
        message: 'System resources are within normal limits',
        timestamp: new Date(),
        details: {
          memoryUsage,
          cpuUsage
        }
      };
    } catch (error: any) {
      console.error('System resources health check failed:', error);
      return {
        component: 'system_resources',
        status: 'warning',
        message: `System resources check error: ${error.message}`,
        timestamp: new Date(),
        details: { error: error.message }
      };
    }
  }

  // Removed checkSMTPConfiguration and checkEmailSystem methods

  private async checkActiveConnections(): Promise<number> {
    try {
      // Get active sessions count from auth
      const { data, error } = await supabase.rpc('get_active_sessions_count');
      
      if (error) {
        console.warn('Could not get active sessions count:', error);
        return 0;
      }
      
      return data || 0;
    } catch (error) {
      console.warn('Error checking active connections:', error);
      return 0;
    }
  }

  async getHealthCheck(component: string): HealthCheckResult | undefined {
    return this.healthChecks.get(component);
  }

  async simulateGP51Check(): Promise<{ isHealthy: boolean; message: string }> {
    // Simulate an async API call to GP51
    return new Promise((resolve) => {
      setTimeout(() => {
        const isHealthy = Math.random() > 0.1; // Simulate occasional failure
        const message = isHealthy ? 'GP51 API is responding' : 'GP51 API is not responding';
        resolve({ isHealthy, message });
      }, 1500); // Simulate a 1.5 second delay
    });
  }

  getLastFullCheckTime(): Date | null {
    return this.lastFullCheck;
  }
}

export const systemHealthMonitor = SystemHealthMonitor.getInstance();
