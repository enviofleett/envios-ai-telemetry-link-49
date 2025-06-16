
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface AnalyticsMetrics {
  totalVehicles: number;
  activeVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  vehiclesByStatus: {
    online: number;
    offline: number;
    idle: number;
    moving: number;
  };
  performanceMetrics: {
    averageResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? (Date.now() - cached.timestamp) < this.CACHE_TTL : false;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any {
    return this.cache.get(key)?.data;
  }

  async getSystemMetrics(): Promise<AnalyticsMetrics> {
    const cacheKey = 'system-metrics';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      // Fetch vehicles with error handling
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id, created_at, updated_at');

      if (vehiclesError) {
        console.error('Error fetching vehicles for analytics:', vehiclesError);
        throw vehiclesError;
      }

      const vehicles = vehiclesData || [];
      const totalVehicles = vehicles.length;
      
      // Since we don't have is_active column, assume all vehicles are active
      const activeVehicles = totalVehicles;
      const offlineVehicles = 0;

      // Calculate recently active vehicles (updated in last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentlyActiveVehicles = vehicles.filter(v => v.updated_at > twentyFourHoursAgo).length;

      const metrics: AnalyticsMetrics = {
        totalVehicles,
        activeVehicles,
        offlineVehicles,
        recentlyActiveVehicles,
        vehiclesByStatus: {
          online: Math.floor(totalVehicles * 0.7), // Mock data
          offline: Math.floor(totalVehicles * 0.2),
          idle: Math.floor(totalVehicles * 0.05),
          moving: Math.floor(totalVehicles * 0.05),
        },
        performanceMetrics: {
          averageResponseTime: 150,
          uptime: 99.5,
          errorRate: 0.1,
        },
      };

      this.setCache(cacheKey, metrics);
      return metrics;

    } catch (error) {
      console.error('Error getting system metrics:', error);
      // Return default metrics in case of error
      return {
        totalVehicles: 0,
        activeVehicles: 0,
        offlineVehicles: 0,
        recentlyActiveVehicles: 0,
        vehiclesByStatus: { online: 0, offline: 0, idle: 0, moving: 0 },
        performanceMetrics: { averageResponseTime: 0, uptime: 0, errorRate: 0 },
      };
    }
  }

  async getVehicleAnalytics(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<VehicleData[]> {
    const cacheKey = `vehicle-analytics-${timeRange}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const { data: vehiclesData, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicle analytics:', error);
        throw error;
      }

      const vehicles = vehiclesData || [];
      
      // Transform database records to VehicleData
      const transformedVehicles: VehicleData[] = vehicles.map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        device_name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        status: 'offline' as const, // Default status
        is_active: true, // Default value
        isOnline: false,
        isMoving: false,
        alerts: [],
        lastUpdate: new Date(vehicle.updated_at),
      }));

      this.setCache(cacheKey, transformedVehicles);
      return transformedVehicles;

    } catch (error) {
      console.error('Error getting vehicle analytics:', error);
      return [];
    }
  }

  async getUserActivityAnalytics(): Promise<any> {
    const cacheKey = 'user-activity';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const { data: usersData, error } = await supabase
        .from('envio_users')
        .select('id, name, email, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user analytics:', error);
        throw error;
      }

      const analytics = {
        totalUsers: usersData?.length || 0,
        activeUsers: usersData?.length || 0, // Simplified
        newUsersToday: 0, // Would need more complex logic
        userGrowthRate: 0, // Would need historical data
      };

      this.setCache(cacheKey, analytics);
      return analytics;

    } catch (error) {
      console.error('Error getting user activity analytics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        userGrowthRate: 0,
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  async refreshMetrics(): Promise<void> {
    this.clearCache();
    await Promise.all([
      this.getSystemMetrics(),
      this.getVehicleAnalytics(),
      this.getUserActivityAnalytics(),
    ]);
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService;
