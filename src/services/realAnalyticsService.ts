
import type { RealAnalyticsData } from '@/types/gp51-unified';
import { createDefaultAnalyticsData } from '@/types/gp51-unified';

class RealAnalyticsService {
  async getRealAnalyticsData(): Promise<RealAnalyticsData> {
    try {
      const analyticsData = createDefaultAnalyticsData();
      
      // Simulate some real data
      analyticsData.totalVehicles = 25;
      analyticsData.activeVehicles = 18;
      analyticsData.performance.fuelEfficiency = 8.5;
      analyticsData.alerts.total = 3;
      
      return analyticsData;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return createDefaultAnalyticsData();
    }
  }

  async getFleetUtilization(): Promise<number> {
    try {
      const data = await this.getRealAnalyticsData();
      return data.fleetUtilization.percentage;
    } catch (error) {
      console.error('Error fetching fleet utilization:', error);
      return 0;
    }
  }
}

export const realAnalyticsService = new RealAnalyticsService();
export const getRealAnalyticsData = () => realAnalyticsService.getRealAnalyticsData();
