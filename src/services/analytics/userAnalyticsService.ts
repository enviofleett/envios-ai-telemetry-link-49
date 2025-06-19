
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

export interface UserVehicleAnalytics {
  userId: string;
  userName: string;
  totalVehicles: number;
  activeVehicles: number;
  totalMileage: number;
  averageSpeed: number;
  fuelEfficiency: number;
  drivingHours: number;
  alertsCount: number;
  lastActivityDate: string;
  utilizationRate: number;
  performanceScore: number;
  monthlyTrends: {
    month: string;
    mileage: number;
    fuelUsed: number;
    tripCount: number;
  }[];
  vehicleUsage: {
    vehicleId: string;
    vehicleName: string;
    usage: number;
    mileage: number;
    alerts: number;
  }[];
}

export interface FleetAnalytics {
  totalUsers: number;
  totalVehicles: number;
  averageUtilization: number;
  topPerformers: UserVehicleAnalytics[];
  fleetEfficiency: number;
  totalMileage: number;
  alertTrends: {
    date: string;
    count: number;
    severity: string;
  }[];
  maintenanceCosts: {
    month: string;
    cost: number;
    vehicleCount: number;
  }[];
}

class UserAnalyticsService {
  private static instance: UserAnalyticsService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UserAnalyticsService {
    if (!UserAnalyticsService.instance) {
      UserAnalyticsService.instance = new UserAnalyticsService();
    }
    return UserAnalyticsService.instance;
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

  async getUserVehicleAnalytics(userId: string): Promise<UserVehicleAnalytics> {
    const cacheKey = `user-analytics-${userId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      // Get user info
      const { data: userData, error: userError } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get user's vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId);

      if (vehiclesError) throw vehiclesError;

      const vehicles = vehiclesData || [];
      const activeVehicles = vehicles.filter(v => v.created_at).length;

      // Mock analytics data (in real implementation, this would come from position history)
      const analytics: UserVehicleAnalytics = {
        userId: userData.id,
        userName: userData.name,
        totalVehicles: vehicles.length,
        activeVehicles,
        totalMileage: Math.floor(Math.random() * 50000) + 10000,
        averageSpeed: Math.floor(Math.random() * 30) + 45,
        fuelEfficiency: Math.floor(Math.random() * 20) + 80,
        drivingHours: Math.floor(Math.random() * 100) + 50,
        alertsCount: Math.floor(Math.random() * 10),
        lastActivityDate: new Date().toISOString(),
        utilizationRate: Math.random() * 0.4 + 0.6,
        performanceScore: Math.floor(Math.random() * 20) + 80,
        monthlyTrends: this.generateMonthlyTrends(),
        vehicleUsage: vehicles.map(v => ({
          vehicleId: v.id,
          vehicleName: v.name,
          usage: Math.random(),
          mileage: Math.floor(Math.random() * 5000) + 1000,
          alerts: Math.floor(Math.random() * 5)
        }))
      };

      this.setCache(cacheKey, analytics);
      return analytics;

    } catch (error) {
      console.error('Error getting user vehicle analytics:', error);
      throw error;
    }
  }

  async getFleetAnalytics(): Promise<FleetAnalytics> {
    const cacheKey = 'fleet-analytics';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      // Get all users with vehicles
      const { data: usersData, error: usersError } = await supabase
        .from('envio_users')
        .select(`
          id, name, email,
          vehicles:vehicles(count)
        `)
        .not('vehicles', 'is', null);

      if (usersError) throw usersError;

      // Get total vehicle count
      const { count: totalVehicles, error: vehicleCountError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      if (vehicleCountError) throw vehicleCountError;

      // Generate top performers
      const topPerformers: UserVehicleAnalytics[] = [];
      for (const user of (usersData || []).slice(0, 5)) {
        try {
          const analytics = await this.getUserVehicleAnalytics(user.id);
          topPerformers.push(analytics);
        } catch (error) {
          console.error(`Error getting analytics for user ${user.id}:`, error);
        }
      }

      const fleetAnalytics: FleetAnalytics = {
        totalUsers: usersData?.length || 0,
        totalVehicles: totalVehicles || 0,
        averageUtilization: 0.75,
        topPerformers: topPerformers.sort((a, b) => b.performanceScore - a.performanceScore),
        fleetEfficiency: 85,
        totalMileage: topPerformers.reduce((sum, user) => sum + user.totalMileage, 0),
        alertTrends: this.generateAlertTrends(),
        maintenanceCosts: this.generateMaintenanceCosts()
      };

      this.setCache(cacheKey, fleetAnalytics);
      return fleetAnalytics;

    } catch (error) {
      console.error('Error getting fleet analytics:', error);
      throw error;
    }
  }

  private generateMonthlyTrends() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      mileage: Math.floor(Math.random() * 3000) + 1000,
      fuelUsed: Math.floor(Math.random() * 200) + 100,
      tripCount: Math.floor(Math.random() * 50) + 20
    }));
  }

  private generateAlertTrends() {
    const days = 7;
    const trends = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 20) + 5,
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      });
    }
    return trends;
  }

  private generateMaintenanceCosts() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      cost: Math.floor(Math.random() * 5000) + 2000,
      vehicleCount: Math.floor(Math.random() * 10) + 5
    }));
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const userAnalyticsService = UserAnalyticsService.getInstance();
