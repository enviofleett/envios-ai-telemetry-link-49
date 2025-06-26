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
  };
  userGrowth: Array<{
    date: string;
    users: number;
    vehicles: number;
  }>;
  vehicleStatus: {
    active: number;
    inactive: number;
    synced: number;
    unsynced: number;
  };
  gp51Status: {
    importedUsers: number;
    importedVehicles: number;
    lastSync: string | null;
  };
  gp51Fleet?: {
    onlineDevices: number;
    movingDevices: number;
    parkedDevices: number;
    groups: number;
  };
}

class RealAnalyticsService {
  async getAnalyticsData(): Promise<RealAnalyticsData> {
    try {
      console.log('🔄 Fetching real analytics data...');

      // Get user statistics from Supabase
      const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id, created_at, registration_status, is_gp51_imported');

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Get vehicle statistics from Supabase
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, created_at, is_active, updated_at');

      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
      }

      // Try to get GP51 fleet data if available
      let gp51FleetData = null;
      try {
        const fleetResult = await gp51UnifiedDataService.getCompleteFleetData({ includePositions: true });
        if (fleetResult.success) {
          gp51FleetData = fleetResult.data;
        }
      } catch (error) {
        console.log('GP51 data not available, using Supabase data only');
      }

      // Calculate user stats
      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.registration_status === 'active').length || 0;
      const importedUsers = users?.filter(u => u.is_gp51_imported).length || 0;

      // Calculate vehicle stats - prioritize GP51 data if available
      let totalVehicles = vehicles?.length || 0;
      let activeVehicles = vehicles?.filter(v => v.is_active).length || 0;
      let inactiveVehicles = vehicles?.filter(v => !v.is_active).length || 0;

      // Enhanced stats from GP51 if available
      const gp51Fleet = gp51FleetData ? {
        onlineDevices: gp51FleetData.summary.onlineDevices,
        movingDevices: gp51FleetData.summary.movingDevices,
        parkedDevices: gp51FleetData.summary.parkedDevices,
        groups: gp51FleetData.summary.groups
      } : undefined;

      // Use GP51 data for vehicle counts if available and higher
      if (gp51FleetData && gp51FleetData.summary.totalDevices > totalVehicles) {
        totalVehicles = gp51FleetData.summary.totalDevices;
        activeVehicles = gp51FleetData.summary.activeDevices;
        inactiveVehicles = totalVehicles - activeVehicles;
      }

      // Calculate recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newUsers = users?.filter(u => new Date(u.created_at) > sevenDaysAgo).length || 0;
      const newVehicles = vehicles?.filter(v => new Date(v.created_at) > sevenDaysAgo).length || 0;

      // Generate growth data for the last 30 days
      const growthData = this.generateGrowthData(users || [], vehicles || []);

      // Find last sync time from vehicle updates
      const lastSyncTimes = vehicles
        ?.filter(v => v.updated_at)
        .map(v => new Date(v.updated_at))
        .sort((a, b) => b.getTime() - a.getTime());

      const lastSync = lastSyncTimes && lastSyncTimes.length > 0 
        ? lastSyncTimes[0].toISOString() 
        : null;

      const analyticsData: RealAnalyticsData = {
        totalUsers,
        activeUsers,
        totalVehicles,
        activeVehicles,
        recentActivity: {
          newUsers,
          newVehicles,
          period: 'Last 7 days'
        },
        userGrowth: growthData,
        vehicleStatus: {
          active: activeVehicles,
          inactive: inactiveVehicles,
          synced: gp51FleetData?.summary.totalDevices || 0,
          unsynced: Math.max(0, totalVehicles - (gp51FleetData?.summary.totalDevices || 0))
        },
        gp51Status: {
          importedUsers,
          importedVehicles: gp51FleetData?.summary.totalDevices || 0,
          lastSync
        }
      };

      // Add GP51 fleet data if available
      if (gp51Fleet) {
        analyticsData.gp51Fleet = gp51Fleet;
      }

      console.log('✅ Real analytics data loaded:', analyticsData);
      return analyticsData;

    } catch (error) {
      console.error('Error fetching real analytics data:', error);
      
      // Return zero data if there's an error
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalVehicles: 0,
        activeVehicles: 0,
        recentActivity: {
          newUsers: 0,
          newVehicles: 0,
          period: 'Last 7 days'
        },
        userGrowth: [],
        vehicleStatus: {
          active: 0,
          inactive: 0,
          synced: 0,
          unsynced: 0
        },
        gp51Status: {
          importedUsers: 0,
          importedVehicles: 0,
          lastSync: null
        }
      };
    }
  }

  private generateGrowthData(users: any[], vehicles: any[]): Array<{ date: string; users: number; vehicles: number }> {
    const days = 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const usersUpToDate = users.filter(u => new Date(u.created_at) <= date).length;
      const vehiclesUpToDate = vehicles.filter(v => new Date(v.created_at) <= date).length;

      data.push({
        date: dateStr,
        users: usersUpToDate,
        vehicles: vehiclesUpToDate
      });
    }

    return data;
  }

  async getUserBreakdown() {
    try {
      const { data: users, error } = await supabase
        .from('envio_users')
        .select('registration_status, is_gp51_imported, gp51_user_type, created_at');

      if (error) throw error;

      const breakdown = {
        byStatus: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        byUserType: {} as Record<string, number>,
        total: users?.length || 0
      };

      users?.forEach(user => {
        // By status
        const status = user.registration_status || 'unknown';
        breakdown.byStatus[status] = (breakdown.byStatus[status] || 0) + 1;

        // By source
        const source = user.is_gp51_imported ? 'GP51 Import' : 'Manual';
        breakdown.bySource[source] = (breakdown.bySource[source] || 0) + 1;

        // By GP51 user type
        if (user.gp51_user_type) {
          const typeMap: Record<number, string> = {
            3: 'Sub Admin',
            4: 'Company Admin',
            11: 'End User',
            99: 'Device'
          };
          const typeName = typeMap[user.gp51_user_type] || `Type ${user.gp51_user_type}`;
          breakdown.byUserType[typeName] = (breakdown.byUserType[typeName] || 0) + 1;
        }
      });

      return breakdown;
    } catch (error) {
      console.error('Error fetching user breakdown:', error);
      return {
        byStatus: {},
        bySource: {},
        byUserType: {},
        total: 0
      };
    }
  }

  async getVehicleBreakdown() {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('is_active, created_at');

      if (error) throw error;

      const breakdown = {
        byStatus: {} as Record<string, number>,
        bySync: {} as Record<string, number>,
        byDeviceType: {} as Record<string, number>,
        total: vehicles?.length || 0
      };

      vehicles?.forEach(vehicle => {
        // By status
        const status = vehicle.is_active ? 'active' : 'inactive';
        breakdown.byStatus[status] = (breakdown.byStatus[status] || 0) + 1;

        // By sync status - placeholder until GP51 integration
        const syncStatus = 'Not Synced';
        breakdown.bySync[syncStatus] = (breakdown.bySync[syncStatus] || 0) + 1;

        // By device type - placeholder
        const deviceType = 'Unknown';
        breakdown.byDeviceType[deviceType] = (breakdown.byDeviceType[deviceType] || 0) + 1;
      });

      return breakdown;
    } catch (error) {
      console.error('Error fetching vehicle breakdown:', error);
      return {
        byStatus: {},
        bySync: {},
        byDeviceType: {},
        total: 0
      };
    }
  }
}

export const realAnalyticsService = new RealAnalyticsService();
