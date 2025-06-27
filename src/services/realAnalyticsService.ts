
import { supabase } from '@/integrations/supabase/client';
import { gp51UnifiedDataService } from './gp51/GP51UnifiedDataService';

export interface RealAnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  activeVehicles: number;
  recentActivity: {
    newUsers: number;
    newVehicles: number;
    period: string;
    percentageChange: number;
  };
  gp51Status: {
    importedUsers: number;
    importedVehicles: number;
    lastSync: Date;
    status: 'success' | 'pending' | 'error';
  };
  vehicleStatus: {
    total: number;
    online: number;
    offline: number;
    moving: number;
    parked: number;
  };
  fleetUtilization: {
    activeVehicles: number;
    totalVehicles: number;
    utilizationRate: number;
  };
  systemHealth: {
    apiStatus: 'healthy' | 'degraded' | 'down';
    lastUpdate: Date;
    responseTime: number;
  };
  performance: {
    averageSpeed: number;
    totalDistance: number;
    fuelEfficiency?: number;
    alertCount: number;
  };
}

class RealAnalyticsService {
  async getAnalyticsData(): Promise<RealAnalyticsData> {
    try {
      console.log('🔄 Loading real analytics data...');

      // Fetch GP51 data as primary source
      const gp51Data = await this.getGP51Analytics();
      
      // Fetch Supabase data as secondary/fallback
      const supabaseData = await this.getSupabaseAnalytics();

      // Combine data with GP51 as primary source
      const combinedData: RealAnalyticsData = {
        totalUsers: gp51Data.totalUsers + supabaseData.totalUsers,
        activeUsers: gp51Data.activeUsers + supabaseData.activeUsers,
        totalVehicles: gp51Data.totalVehicles + supabaseData.totalVehicles,
        activeVehicles: gp51Data.activeVehicles + supabaseData.activeVehicles,
        recentActivity: {
          newUsers: gp51Data.recentActivity.newUsers + supabaseData.recentActivity.newUsers,
          newVehicles: gp51Data.recentActivity.newVehicles + supabaseData.recentActivity.newVehicles,
          period: gp51Data.recentActivity.period,
          percentageChange: gp51Data.recentActivity.percentageChange
        },
        gp51Status: {
          importedUsers: gp51Data.totalUsers,
          importedVehicles: gp51Data.totalVehicles,
          lastSync: gp51Data.gp51Status.lastSync,
          status: gp51Data.gp51Status.status
        },
        vehicleStatus: {
          total: gp51Data.vehicleStatus.total + supabaseData.vehicleStatus.total,
          online: gp51Data.vehicleStatus.online + supabaseData.vehicleStatus.online,
          offline: gp51Data.vehicleStatus.offline + supabaseData.vehicleStatus.offline,
          moving: gp51Data.vehicleStatus.moving + supabaseData.vehicleStatus.moving,
          parked: gp51Data.vehicleStatus.parked + supabaseData.vehicleStatus.parked
        },
        fleetUtilization: {
          activeVehicles: gp51Data.fleetUtilization.activeVehicles + supabaseData.fleetUtilization.activeVehicles,
          totalVehicles: gp51Data.fleetUtilization.totalVehicles + supabaseData.fleetUtilization.totalVehicles,
          utilizationRate: gp51Data.fleetUtilization.utilizationRate
        },
        systemHealth: {
          apiStatus: gp51Data.systemHealth.apiStatus,
          lastUpdate: gp51Data.systemHealth.lastUpdate,
          responseTime: gp51Data.systemHealth.responseTime
        },
        performance: {
          averageSpeed: gp51Data.performance.averageSpeed,
          totalDistance: gp51Data.performance.totalDistance + supabaseData.performance.totalDistance,
          fuelEfficiency: gp51Data.performance.fuelEfficiency,
          alertCount: gp51Data.performance.alertCount + supabaseData.performance.alertCount
        }
      };

      console.log('✅ Combined analytics data:', combinedData);
      return combinedData;

    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      
      // Return fallback data if both sources fail
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalVehicles: 0,
        activeVehicles: 0,
        recentActivity: {
          newUsers: 0,
          newVehicles: 0,
          period: 'No Data',
          percentageChange: 0
        },
        gp51Status: {
          importedUsers: 0,
          importedVehicles: 0,
          lastSync: new Date(),
          status: 'error'
        },
        vehicleStatus: {
          total: 0,
          online: 0,
          offline: 0,
          moving: 0,
          parked: 0
        },
        fleetUtilization: {
          activeVehicles: 0,
          totalVehicles: 0,
          utilizationRate: 0
        },
        systemHealth: {
          apiStatus: 'down',
          lastUpdate: new Date(),
          responseTime: 0
        },
        performance: {
          averageSpeed: 0,
          totalDistance: 0,
          fuelEfficiency: 0,
          alertCount: 0
        }
      };
    }
  }

  private async getGP51Analytics(): Promise<RealAnalyticsData> {
    try {
      // Get GP51 analytics data
      const analyticsData = await gp51UnifiedDataService.getAnalyticsData();
      return analyticsData;
    } catch (error) {
      console.log('GP51 analytics not available:', error);
    }

    // Return zero data if GP51 is not available
    return this.getEmptyAnalyticsData();
  }

  private async getSupabaseAnalytics(): Promise<RealAnalyticsData> {
    try {
      // Get users data
      const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id, created_at, registration_status');

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Get vehicles data  
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, created_at, status, user_id');

      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
      }

      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.registration_status === 'active').length || 0;
      const totalVehicles = vehicles?.length || 0;
      const activeVehicles = vehicles?.filter(v => v.status === 'active').length || 0;

      // Calculate recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const newUsers = users?.filter(u => 
        new Date(u.created_at) > weekAgo
      ).length || 0;
      
      const newVehicles = vehicles?.filter(v => 
        new Date(v.created_at) > weekAgo
      ).length || 0;

      return {
        totalUsers,
        activeUsers,
        totalVehicles,
        activeVehicles,
        recentActivity: {
          newUsers,
          newVehicles,
          period: 'This Week',
          percentageChange: 0
        },
        gp51Status: {
          importedUsers: 0, // No GP51 data from Supabase
          importedVehicles: 0,
          lastSync: new Date(),
          status: 'success'
        },
        vehicleStatus: {
          total: totalVehicles,
          online: Math.floor(totalVehicles * 0.7), // Mock data
          offline: Math.floor(totalVehicles * 0.3),
          moving: Math.floor(totalVehicles * 0.2),
          parked: Math.floor(totalVehicles * 0.5)
        },
        fleetUtilization: {
          activeVehicles,
          totalVehicles,
          utilizationRate: totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0
        },
        systemHealth: {
          apiStatus: totalVehicles > 0 ? 'healthy' : 'degraded',
          lastUpdate: new Date(),
          responseTime: 100
        },
        performance: {
          averageSpeed: 45, // Mock data
          totalDistance: totalVehicles * 1000, // Mock data
          fuelEfficiency: 8.5,
          alertCount: Math.floor(totalVehicles * 0.1) // Mock data
        }
      };

    } catch (error) {
      console.error('Error fetching Supabase analytics:', error);
      return this.getEmptyAnalyticsData();
    }
  }

  private getEmptyAnalyticsData(): RealAnalyticsData {
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalVehicles: 0,
      activeVehicles: 0,
      recentActivity: {
        newUsers: 0,
        newVehicles: 0,
        period: 'No Data',
        percentageChange: 0
      },
      gp51Status: {
        importedUsers: 0,
        importedVehicles: 0,
        lastSync: new Date(),
        status: 'error'
      },
      vehicleStatus: {
        total: 0,
        online: 0,
        offline: 0,
        moving: 0,
        parked: 0
      },
      fleetUtilization: {
        activeVehicles: 0,
        totalVehicles: 0,
        utilizationRate: 0
      },
      systemHealth: {
        apiStatus: 'down',
        lastUpdate: new Date(),
        responseTime: 0
      },
      performance: {
        averageSpeed: 0,
        totalDistance: 0,
        fuelEfficiency: 0,
        alertCount: 0
      }
    };
  }
}

export const realAnalyticsService = new RealAnalyticsService();
