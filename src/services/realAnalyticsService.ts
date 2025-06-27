
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
  };
  gp51Status: {
    importedUsers: number;
    importedVehicles: number;
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
          newVehicles: gp51Data.recentActivity.newVehicles + supabaseData.recentActivity.newVehicles
        },
        gp51Status: {
          importedUsers: gp51Data.totalUsers,
          importedVehicles: gp51Data.totalVehicles
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
          newVehicles: 0
        },
        gp51Status: {
          importedUsers: 0,
          importedVehicles: 0
        }
      };
    }
  }

  private async getGP51Analytics(): Promise<RealAnalyticsData> {
    try {
      // Try to get GP51 fleet data
      const fleetData = await gp51UnifiedDataService.getCompleteFleetData({
        includePositions: true,
        includeInactive: true
      });

      if (fleetData.success) {
        const summary = fleetData.data.summary;
        
        return {
          totalUsers: summary.groups, // Use groups as user proxy for GP51
          activeUsers: Math.floor(summary.groups * 0.8), // Estimate active users
          totalVehicles: summary.totalDevices,
          activeVehicles: summary.activeDevices,
          recentActivity: {
            newUsers: Math.floor(summary.groups * 0.1), // Estimate
            newVehicles: Math.floor(summary.totalDevices * 0.05) // Estimate
          },
          gp51Status: {
            importedUsers: summary.groups,
            importedVehicles: summary.totalDevices
          }
        };
      }
    } catch (error) {
      console.log('GP51 analytics not available:', error);
    }

    // Return zero data if GP51 is not available
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalVehicles: 0,
      activeVehicles: 0,
      recentActivity: {
        newUsers: 0,
        newVehicles: 0
      },
      gp51Status: {
        importedUsers: 0,
        importedVehicles: 0
      }
    };
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
          newVehicles
        },
        gp51Status: {
          importedUsers: 0, // No GP51 data from Supabase
          importedVehicles: 0
        }
      };

    } catch (error) {
      console.error('Error fetching Supabase analytics:', error);
      
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalVehicles: 0,
        activeVehicles: 0,
        recentActivity: {
          newUsers: 0,
          newVehicles: 0
        },
        gp51Status: {
          importedUsers: 0,
          importedVehicles: 0
        }
      };
    }
  }
}

export const realAnalyticsService = new RealAnalyticsService();
