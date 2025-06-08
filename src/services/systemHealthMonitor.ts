
import { supabase } from '@/integrations/supabase/client';

export interface SystemHealthStatus {
  database: 'healthy' | 'degraded' | 'down';
  smtp: 'healthy' | 'degraded' | 'down';
  gp51: 'healthy' | 'degraded' | 'down';
  auth: 'healthy' | 'degraded' | 'down';
  emailVerification: 'healthy' | 'degraded' | 'down';
  overall: 'healthy' | 'degraded' | 'down';
  lastChecked: string;
}

export class SystemHealthMonitor {
  static async checkSystemHealth(): Promise<SystemHealthStatus> {
    const results = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkSMTPHealth(),
      this.checkGP51Health(),
      this.checkAuthHealth(),
      this.checkEmailVerificationHealth()
    ]);

    const [database, smtp, gp51, auth, emailVerification] = results.map(result => 
      result.status === 'fulfilled' ? result.value : 'down'
    ) as [string, string, string, string, string];

    const healthStatuses = [database, smtp, gp51, auth, emailVerification];
    const overall = this.calculateOverallHealth(healthStatuses);

    return {
      database: database as any,
      smtp: smtp as any,
      gp51: gp51 as any,
      auth: auth as any,
      emailVerification: emailVerification as any,
      overall: overall as any,
      lastChecked: new Date().toISOString()
    };
  }

  private static async checkDatabaseHealth(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('envio_users')
        .select('count(*)', { count: 'exact', head: true });
      
      return error ? 'degraded' : 'healthy';
    } catch (error) {
      console.error('Database health check failed:', error);
      return 'down';
    }
  }

  private static async checkSMTPHealth(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('smtp_configurations')
        .select('is_active')
        .eq('is_active', true)
        .single();
      
      if (error || !data) return 'down';
      return 'healthy';
    } catch (error) {
      console.error('SMTP health check failed:', error);
      return 'down';
    }
  }

  private static async checkGP51Health(): Promise<string> {
    try {
      // This would normally check GP51 API connectivity
      // For now, we'll check if we have any recent successful sessions
      const { data, error } = await supabase
        .from('gp51_sessions')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      
      if (error) return 'degraded';
      return data && data.length > 0 ? 'healthy' : 'degraded';
    } catch (error) {
      console.error('GP51 health check failed:', error);
      return 'down';
    }
  }

  private static async checkAuthHealth(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return 'healthy';
    } catch (error) {
      console.error('Auth health check failed:', error);
      return 'down';
    }
  }

  private static async checkEmailVerificationHealth(): Promise<string> {
    try {
      // Check if email verification system is working
      const { data, error } = await supabase
        .from('email_verifications')
        .select('count(*)', { count: 'exact', head: true });
      
      return error ? 'degraded' : 'healthy';
    } catch (error) {
      console.error('Email verification health check failed:', error);
      return 'down';
    }
  }

  private static calculateOverallHealth(statuses: string[]): string {
    const downCount = statuses.filter(s => s === 'down').length;
    const degradedCount = statuses.filter(s => s === 'degraded').length;
    
    if (downCount > 0) return 'down';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  static async getHealthMetrics() {
    try {
      const health = await this.checkSystemHealth();
      
      // Get additional metrics
      const [userCount, vehicleCount, emailCount] = await Promise.all([
        this.getUserCount(),
        this.getVehicleCount(),
        this.getEmailCount()
      ]);

      return {
        ...health,
        metrics: {
          totalUsers: userCount,
          totalVehicles: vehicleCount,
          emailsSentToday: emailCount
        }
      };
    } catch (error) {
      console.error('Failed to get health metrics:', error);
      return null;
    }
  }

  private static async getUserCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('envio_users')
        .select('*', { count: 'exact', head: true });
      return error ? 0 : count || 0;
    } catch {
      return 0;
    }
  }

  private static async getVehicleCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });
      return error ? 0 : count || 0;
    } catch {
      return 0;
    }
  }

  private static async getEmailCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('email_notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      return error ? 0 : count || 0;
    } catch {
      return 0;
    }
  }
}
