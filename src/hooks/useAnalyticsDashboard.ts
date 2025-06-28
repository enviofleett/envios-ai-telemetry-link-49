
import { useState, useEffect } from 'react';
import type { AnalyticsHookReturn, RealAnalyticsData } from '@/types/gp51-unified';

export const useAnalyticsDashboard = (): AnalyticsHookReturn => {
  const [data, setData] = useState<RealAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock analytics data
      const mockData: RealAnalyticsData = {
        totalUsers: 100,
        activeUsers: 75,
        totalVehicles: 50,
        activeVehicles: 35,
        recentActivity: [],
        vehicleStatus: {
          total: 50,
          online: 35,
          offline: 15,
          moving: 20,
          parked: 30
        },
        fleetUtilization: {
          activeVehicles: 35,
          totalVehicles: 50,
          utilizationRate: 70
        },
        systemHealth: {
          apiStatus: "healthy",
          lastUpdate: new Date(),
          responseTime: 150
        },
        performance: {
          averageSpeed: 45,
          totalDistance: 1000,
          alertCount: 5
        },
        growth: {
          newUsers: 10,
          newVehicles: 5,
          period: "month",
          percentageChange: 15
        },
        sync: {
          importedUsers: 95,
          importedVehicles: 48,
          lastSync: new Date(),
          status: "success"
        }
      };
      
      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    
    // Additional properties for compatibility
    analyticsData: data,
    loading: isLoading,
    lastUpdated: data ? new Date().toISOString() : '',
    refreshData: refetch
  };
};
