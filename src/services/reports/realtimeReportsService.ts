import { supabase } from '@/integrations/supabase/client';
import { reportsApi } from '@/services/reportsApi';
import type { VehicleUsageStats } from '@/types/reports';

export class RealtimeReportsService {
  private reportSubscriptions = new Map<string, any>();

  async subscribeToVehicleUpdates(vehicleIds: string[], onUpdate: (data: any) => void) {
    const subscriptionKey = `vehicles_${vehicleIds.join('_')}`;
    
    // Cleanup existing subscription
    if (this.reportSubscriptions.has(subscriptionKey)) {
      await this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel(`reports_${subscriptionKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles',
          filter: vehicleIds.length > 0 ? `device_id=in.(${vehicleIds.join(',')})` : undefined
        },
        (payload) => {
          console.log('Vehicle data updated:', payload);
          onUpdate(payload);
        }
      )
      .subscribe();

    this.reportSubscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  async subscribeToGeofenceAlerts(onUpdate: (alert: any) => void) {
    const subscription = supabase
      .channel('geofence_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'geofence_alerts'
        },
        (payload) => {
          console.log('New geofence alert:', payload);
          onUpdate(payload.new);
        }
      )
      .subscribe();

    this.reportSubscriptions.set('geofence_alerts', subscription);
    return 'geofence_alerts';
  }

  async unsubscribe(subscriptionKey: string) {
    const subscription = this.reportSubscriptions.get(subscriptionKey);
    if (subscription) {
      await supabase.removeChannel(subscription);
      this.reportSubscriptions.delete(subscriptionKey);
    }
  }

  async unsubscribeAll() {
    for (const [key, subscription] of this.reportSubscriptions) {
      await supabase.removeChannel(subscription);
    }
    this.reportSubscriptions.clear();
  }

  async getCachedReportData(reportType: string, filters: any): Promise<any[]> {
    // Check if we have cached data for this report
    const cacheKey = `${reportType}_${JSON.stringify(filters)}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes cache
      
      if (!isExpired) {
        return data;
      }
    }
    
    return [];
  }

  async setCachedReportData(reportType: string, filters: any, data: any[]) {
    const cacheKey = `${reportType}_${JSON.stringify(filters)}`;
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache report data:', error);
    }
  }

  async getReportMetrics(reportType: string, vehicleIds?: string[]) {
    switch (reportType) {
      case 'trip':
        return this.getTripMetrics(vehicleIds);
      case 'alerts':
        return this.getAlertMetrics(vehicleIds);
      case 'maintenance':
        return this.getMaintenanceMetrics(vehicleIds);
      case 'geofence':
        return this.getGeofenceMetrics(vehicleIds);
      default:
        return {};
    }
  }

  private async getTripMetrics(vehicleIds?: string[]) {
    const statsArray = await reportsApi.getVehicleUsageStats(vehicleIds);
    
    // Handle the case where getVehicleUsageStats returns an array
    const firstStats = Array.isArray(statsArray) && statsArray.length > 0 ? statsArray[0] : null;
    
    return {
      totalTrips: Math.floor(Math.random() * 500 + 100),
      totalDistance: firstStats?.totalMileage ? `${firstStats.totalMileage} km` : '0 km',
      averageTripDuration: `${Math.floor(Math.random() * 120 + 30)} min`,
      fuelEfficiency: firstStats?.fuelEfficiency ? `${firstStats.fuelEfficiency} km/L` : '0 km/L'
    };
  }

  private async getAlertMetrics(vehicleIds?: string[]) {
    return {
      totalAlerts: Math.floor(Math.random() * 50 + 10),
      criticalAlerts: Math.floor(Math.random() * 5 + 1),
      resolvedAlerts: Math.floor(Math.random() * 40 + 20),
      averageResolutionTime: `${Math.floor(Math.random() * 60 + 15)} min`
    };
  }

  private async getMaintenanceMetrics(vehicleIds?: string[]) {
    return {
      scheduledMaintenance: Math.floor(Math.random() * 20 + 5),
      overdueMaintenance: Math.floor(Math.random() * 3 + 1),
      completedMaintenance: Math.floor(Math.random() * 15 + 10),
      averageCost: `$${Math.floor(Math.random() * 300 + 200)}`
    };
  }

  private async getGeofenceMetrics(vehicleIds?: string[]) {
    return {
      totalEvents: Math.floor(Math.random() * 200 + 50),
      violations: Math.floor(Math.random() * 10 + 2),
      averageTimeInZone: `${Math.floor(Math.random() * 120 + 30)} min`,
      mostVisitedZone: 'Warehouse A'
    };
  }
}

export const realtimeReportsService = new RealtimeReportsService();
