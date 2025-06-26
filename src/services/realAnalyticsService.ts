
import { supabase } from '@/integrations/supabase/client';

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
}

class RealAnalyticsService {
  async getAnalyticsData(): Promise<RealAnalyticsData> {
    try {
      // Get user statistics
      const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id, created_at, registration_status, is_gp51_imported');

      if (usersError) throw usersError;

      // Get vehicle statistics
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, created_at, status, is_gp51_synced, last_gp51_sync');

      if (vehiclesError) throw vehiclesError;

      // Calculate user stats
      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.registration_status === 'active').length || 0;
      const importedUsers = users?.filter(u => u.is_gp51_imported).length || 0;

      // Calculate vehicle stats
      const totalVehicles = vehicles?.length || 0;
      const activeVehicles = vehicles?.filter(v => v.status === 'active').length || 0;
      const syncedVehicles = vehicles?.filter(v => v.is_gp51_synced).length || 0;
      const inactiveVehicles = vehicles?.filter(v => v.status === 'inactive').length || 0;

      // Calculate recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newUsers = users?.filter(u => new Date(u.created_at) > sevenDaysAgo).length || 0;
      const newVehicles = vehicles?.filter(v => new Date(v.created_at) > sevenDaysAgo).length || 0;

      // Generate growth data for the last 30 days
      const growthData = this.generateGrowthData(users || [], vehicles || []);

      // Find last sync time
      const lastSyncTimes = vehicles
        ?.filter(v => v.last_gp51_sync)
        .map(v => new Date(v.last_gp51_sync))
        .sort((a, b) => b.getTime() - a.getTime());

      const lastSync = lastSyncTimes && lastSyncTimes.length > 0 
        ? lastSyncTimes[0].toISOString() 
        : null;

      return {
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
          synced: syncedVehicles,
          unsynced: totalVehicles - syncedVehicles
        },
        gp51Status: {
          importedUsers,
          importedVehicles: syncedVehicles,
          lastSync
        }
      };

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
        .select('status, is_gp51_synced, device_type, created_at');

      if (error) throw error;

      const breakdown = {
        byStatus: {} as Record<string, number>,
        bySync: {} as Record<string, number>,
        byDeviceType: {} as Record<string, number>,
        total: vehicles?.length || 0
      };

      vehicles?.forEach(vehicle => {
        // By status
        const status = vehicle.status || 'unknown';
        breakdown.byStatus[status] = (breakdown.byStatus[status] || 0) + 1;

        // By sync status
        const syncStatus = vehicle.is_gp51_synced ? 'GP51 Synced' : 'Not Synced';
        breakdown.bySync[syncStatus] = (breakdown.bySync[syncStatus] || 0) + 1;

        // By device type
        const deviceType = vehicle.device_type || 'Unknown';
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
