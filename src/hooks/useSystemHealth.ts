
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedGP51SessionManager } from '@/services/enhancedGP51SessionManager';

export interface SystemHealthMetrics {
  gp51Status: {
    connected: boolean;
    username?: string;
    expiresAt?: string;
    warningMessage?: string;
    timeUntilExpiry?: number;
  };
  databaseStatus: {
    connected: boolean;
    responseTime?: number;
  };
  apiEndpoints: {
    available: number;
    total: number;
    issues: string[];
  };
  vehicleData: {
    total: number;
    online: number;
    offline: number;
    lastUpdate?: string;
  };
  userMetrics: {
    total: number;
    active: number;
    roles: { [key: string]: number };
  };
  overallHealth: 'healthy' | 'warning' | 'critical';
}

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealthMetrics> => {
      console.log('🔍 Fetching comprehensive system health metrics...');
      
      // Get enhanced GP51 status
      const gp51Status = await EnhancedGP51SessionManager.getSessionStatus();
      
      // Test database connectivity and response time
      const dbStart = Date.now();
      const { data: dbTest, error: dbError } = await supabase
        .from('vehicles')
        .select('id')
        .limit(1);
      const dbResponseTime = Date.now() - dbStart;
      
      const databaseStatus = {
        connected: !dbError,
        responseTime: dbResponseTime
      };

      // Get vehicle metrics
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, status, updated_at')
        .order('updated_at', { ascending: false });

      const vehicleData = {
        total: vehicles?.length || 0,
        online: vehicles?.filter(v => v.status === 'online').length || 0,
        offline: vehicles?.filter(v => v.status === 'offline').length || 0,
        lastUpdate: vehicles?.[0]?.updated_at
      };

      // Get user metrics
      const { data: users, error: userError } = await supabase
        .from('envio_users')
        .select(`
          id, created_at,
          user_roles!left(role)
        `);

      const userMetrics = {
        total: users?.length || 0,
        active: users?.length || 0, // For now, all users are considered active
        roles: users?.reduce((acc: any, user: any) => {
          const role = user.user_roles?.[0]?.role || 'user';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      // Test API endpoints
      const apiTests = [
        { name: 'Settings Management', test: () => supabase.functions.invoke('settings-management', { body: { action: 'health-check' } }) },
        { name: 'GP51 Service', test: () => supabase.functions.invoke('gp51-service-management', { body: { action: 'test_connection' } }) }
      ];

      const apiResults = await Promise.allSettled(
        apiTests.map(async ({ name, test }) => {
          try {
            await test();
            return { name, status: 'ok' };
          } catch (error) {
            return { name, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
          }
        })
      );

      const apiEndpoints = {
        available: apiResults.filter(result => result.status === 'fulfilled' && result.value.status === 'ok').length,
        total: apiTests.length,
        issues: apiResults
          .filter(result => result.status === 'fulfilled' && result.value.status === 'error')
          .map(result => result.status === 'fulfilled' ? `${result.value.name}: ${result.value.error}` : 'Unknown error')
      };

      // Determine overall health
      let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      if (!databaseStatus.connected || !gp51Status.connected) {
        overallHealth = 'critical';
      } else if (gp51Status.warningMessage || apiEndpoints.available < apiEndpoints.total || databaseStatus.responseTime > 2000) {
        overallHealth = 'warning';
      }

      const metrics: SystemHealthMetrics = {
        gp51Status,
        databaseStatus,
        apiEndpoints,
        vehicleData,
        userMetrics,
        overallHealth
      };

      console.log('✅ System health metrics retrieved:', metrics);
      return metrics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Data is fresh for 15 seconds
  });
};
