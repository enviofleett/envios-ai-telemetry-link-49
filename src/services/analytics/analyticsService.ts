
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehiclePosition } from '@/types/vehicle';

export interface AnalyticsMetrics {
  totalFleetMileage: number;
  averageFuelEfficiency: number;
  totalActiveVehicles: number;
  alertCount: number;
  utilizationRate: number;
  maintenanceScore: number;
  costPerMile: number;
  environmentalImpact: number;
}

export interface FleetPerformanceData {
  period: string;
  mileage: number;
  fuelConsumption: number;
  alerts: number;
  utilization: number;
}

export interface VehicleAnalytics {
  vehicleId: string;
  vehicleName: string;
  totalMileage: number;
  fuelEfficiency: number;
  alertCount: number;
  utilizationRate: number;
  maintenanceScore: number;
  lastUpdate: Date;
}

class AnalyticsService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getFleetAnalytics(dateRange?: { from: Date; to: Date }): Promise<AnalyticsMetrics> {
    const cacheKey = `fleet-analytics-${dateRange?.from?.getTime()}-${dateRange?.to?.getTime()}`;
    const cached = this.getCachedData<AnalyticsMetrics>(cacheKey);
    if (cached) return cached;

    try {
      console.log('📊 Calculating real fleet analytics...');
      
      const from = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = dateRange?.to || new Date();

      // Fetch vehicles with telemetry data
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          id,
          device_id,
          device_name,
          is_active,
          vehicle_telemetry(
            timestamp,
            latitude,
            longitude,
            speed,
            fuel_level
          )
        `)
        .gte('vehicle_telemetry.timestamp', from.toISOString())
        .lte('vehicle_telemetry.timestamp', to.toISOString())
        .order('vehicle_telemetry.timestamp', { ascending: true });

      if (vehicleError) {
        throw new Error(`Failed to fetch vehicle data: ${vehicleError.message}`);
      }

      // Fetch alerts data
      const { data: alertData, error: alertError } = await supabase
        .from('vehicle_alerts')
        .select('id, vehicle_id, severity, created_at')
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString());

      if (alertError) {
        console.warn('⚠️ Failed to fetch alerts:', alertError.message);
      }

      const vehicles = vehicleData || [];
      const alerts = alertData || [];
      
      let totalFleetMileage = 0;
      let totalFuelConsumed = 0;
      let totalUtilizationTime = 0;
      let totalAvailableTime = 0;
      let maintenanceScores: number[] = [];
      
      const activeVehicles = vehicles.filter(v => v.is_active);
      
      // Calculate metrics for each vehicle
      for (const vehicle of activeVehicles) {
        const telemetry = vehicle.vehicle_telemetry || [];
        if (telemetry.length < 2) continue;
        
        let vehicleMileage = 0;
        let movingTime = 0;
        let totalTime = 0;
        
        // Calculate distance and utilization
        for (let i = 1; i < telemetry.length; i++) {
          const prev = telemetry[i - 1];
          const curr = telemetry[i];
          
          // Haversine formula for distance
          const lat1 = prev.latitude * Math.PI / 180;
          const lat2 = curr.latitude * Math.PI / 180;
          const deltaLat = (curr.latitude - prev.latitude) * Math.PI / 180;
          const deltaLng = (curr.longitude - prev.longitude) * Math.PI / 180;
          
          const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = 6371 * c; // km
          
          vehicleMileage += distance;
          
          const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60 * 60); // hours
          totalTime += timeDiff;
          
          if ((curr.speed || 0) > 2) { // Moving threshold
            movingTime += timeDiff;
          }
        }
        
        totalFleetMileage += vehicleMileage;
        totalUtilizationTime += movingTime;
        totalAvailableTime += totalTime;
        
        // Estimate fuel consumption (8L/100km baseline, adjusted by speed patterns)
        const estimatedFuelConsumed = vehicleMileage * 0.08;
        totalFuelConsumed += estimatedFuelConsumed;
        
        // Calculate maintenance score based on usage patterns
        const vehicleAlerts = alerts.filter(a => a.vehicle_id === vehicle.device_id);
        const maintenanceScore = Math.max(50, 100 - (vehicleMileage / 10) - (vehicleAlerts.length * 5));
        maintenanceScores.push(maintenanceScore);
      }
      
      // Calculate derived metrics
      const averageFuelEfficiency = totalFuelConsumed > 0 ? totalFleetMileage / totalFuelConsumed : 0;
      const utilizationRate = totalAvailableTime > 0 ? totalUtilizationTime / totalAvailableTime : 0;
      const averageMaintenanceScore = maintenanceScores.length > 0 
        ? maintenanceScores.reduce((a, b) => a + b, 0) / maintenanceScores.length 
        : 85;
      
      // Cost estimation ($0.50 per mile baseline)
      const costPerMile = 0.50;
      
      // Environmental impact (kg CO2 per liter of fuel)
      const environmentalImpact = totalFuelConsumed * 2.31; // kg CO2
      
      const metrics: AnalyticsMetrics = {
        totalFleetMileage: Math.round(totalFleetMileage),
        averageFuelEfficiency: Number(averageFuelEfficiency.toFixed(1)),
        totalActiveVehicles: activeVehicles.length,
        alertCount: alerts.length,
        utilizationRate: Number(utilizationRate.toFixed(2)),
        maintenanceScore: Math.round(averageMaintenanceScore),
        costPerMile,
        environmentalImpact: Math.round(environmentalImpact)
      };
      
      this.setCachedData(cacheKey, metrics);
      console.log('✅ Fleet analytics calculated successfully');
      return metrics;
      
    } catch (error) {
      console.error('❌ Fleet analytics calculation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to calculate fleet analytics');
    }
  }

  async getVehicleAnalytics(vehicleIds?: string[]): Promise<VehicleAnalytics[]> {
    const cacheKey = `vehicle-analytics-${vehicleIds?.join(',') || 'all'}`;
    const cached = this.getCachedData<VehicleAnalytics[]>(cacheKey);
    if (cached) return cached;

    try {
      console.log('🚗 Calculating individual vehicle analytics...');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      let vehiclesQuery = supabase
        .from('vehicles')
        .select(`
          device_id,
          device_name,
          updated_at,
          vehicle_telemetry(
            timestamp,
            latitude,
            longitude,
            speed
          )
        `);
      
      if (vehicleIds && vehicleIds.length > 0) {
        vehiclesQuery = vehiclesQuery.in('device_id', vehicleIds);
      }
      
      const { data: vehicleData, error } = await vehiclesQuery
        .gte('vehicle_telemetry.timestamp', thirtyDaysAgo.toISOString())
        .order('vehicle_telemetry.timestamp', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch vehicle analytics: ${error.message}`);
      }

      // Fetch alerts for all vehicles
      const { data: alertData } = await supabase
        .from('vehicle_alerts')
        .select('vehicle_id, severity, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const alerts = alertData || [];
      
      const analytics: VehicleAnalytics[] = (vehicleData || []).map(vehicle => {
        const telemetry = vehicle.vehicle_telemetry || [];
        const vehicleAlerts = alerts.filter(a => a.vehicle_id === vehicle.device_id);
        
        if (telemetry.length < 2) {
          return {
            vehicleId: vehicle.device_id,
            vehicleName: vehicle.device_name,
            totalMileage: 0,
            fuelEfficiency: 0,
            alertCount: vehicleAlerts.length,
            utilizationRate: 0,
            maintenanceScore: 85,
            lastUpdate: new Date(vehicle.updated_at || Date.now())
          };
        }
        
        let totalDistance = 0;
        let movingTime = 0;
        let totalTime = 0;
        
        for (let i = 1; i < telemetry.length; i++) {
          const prev = telemetry[i - 1];
          const curr = telemetry[i];
          
          // Calculate distance
          const lat1 = prev.latitude * Math.PI / 180;
          const lat2 = curr.latitude * Math.PI / 180;
          const deltaLat = (curr.latitude - prev.latitude) * Math.PI / 180;
          const deltaLng = (curr.longitude - prev.longitude) * Math.PI / 180;
          
          const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = 6371 * c; // km
          
          totalDistance += distance;
          
          const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60 * 60);
          totalTime += timeDiff;
          
          if ((curr.speed || 0) > 2) {
            movingTime += timeDiff;
          }
        }
        
        const utilizationRate = totalTime > 0 ? movingTime / totalTime : 0;
        const estimatedFuelConsumed = totalDistance * 0.08;
        const fuelEfficiency = estimatedFuelConsumed > 0 ? totalDistance / estimatedFuelConsumed : 0;
        const maintenanceScore = Math.max(50, 100 - (totalDistance / 10) - (vehicleAlerts.length * 5));
        
        return {
          vehicleId: vehicle.device_id,
          vehicleName: vehicle.device_name,
          totalMileage: Math.round(totalDistance),
          fuelEfficiency: Number(fuelEfficiency.toFixed(1)),
          alertCount: vehicleAlerts.length,
          utilizationRate: Number(utilizationRate.toFixed(2)),
          maintenanceScore: Math.round(maintenanceScore),
          lastUpdate: new Date(vehicle.updated_at || Date.now())
        };
      });
      
      this.setCachedData(cacheKey, analytics);
      console.log(`✅ Calculated analytics for ${analytics.length} vehicles`);
      return analytics;
      
    } catch (error) {
      console.error('❌ Vehicle analytics calculation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to calculate vehicle analytics');
    }
  }

  async getFleetPerformanceHistory(days: number = 30): Promise<FleetPerformanceData[]> {
    const cacheKey = `fleet-performance-${days}`;
    const cached = this.getCachedData<FleetPerformanceData[]>(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📈 Calculating ${days}-day fleet performance history...`);
      
      const endDate = new Date();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Group by day and calculate daily metrics
      const performanceData: FleetPerformanceData[] = [];
      
      for (let i = 0; i < days; i++) {
        const dayStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const { data: dayTelemetry, error } = await supabase
          .from('vehicle_telemetry')
          .select(`
            latitude,
            longitude,
            speed,
            timestamp,
            vehicle_id
          `)
          .gte('timestamp', dayStart.toISOString())
          .lt('timestamp', dayEnd.toISOString())
          .order('timestamp', { ascending: true });

        if (error) {
          console.warn(`⚠️ Failed to fetch data for ${dayStart.toDateString()}:`, error.message);
          continue;
        }

        // Calculate daily metrics
        let dailyMileage = 0;
        let dailyFuelConsumption = 0;
        let movingTime = 0;
        let totalTime = 0;
        
        const vehicleGroups = new Map<string, any[]>();
        (dayTelemetry || []).forEach(record => {
          if (!vehicleGroups.has(record.vehicle_id)) {
            vehicleGroups.set(record.vehicle_id, []);
          }
          vehicleGroups.get(record.vehicle_id)!.push(record);
        });
        
        vehicleGroups.forEach(records => {
          for (let j = 1; j < records.length; j++) {
            const prev = records[j - 1];
            const curr = records[j];
            
            // Calculate distance
            const lat1 = prev.latitude * Math.PI / 180;
            const lat2 = curr.latitude * Math.PI / 180;
            const deltaLat = (curr.latitude - prev.latitude) * Math.PI / 180;
            const deltaLng = (curr.longitude - prev.longitude) * Math.PI / 180;
            
            const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                      Math.cos(lat1) * Math.cos(lat2) *
                      Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = 6371 * c; // km
            
            dailyMileage += distance;
            dailyFuelConsumption += distance * 0.08; // Estimated fuel consumption
            
            const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60 * 60);
            totalTime += timeDiff;
            
            if ((curr.speed || 0) > 2) {
              movingTime += timeDiff;
            }
          }
        });
        
        // Get daily alerts
        const { data: dayAlerts } = await supabase
          .from('vehicle_alerts')
          .select('id')
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString());
        
        const utilization = totalTime > 0 ? movingTime / totalTime : 0;
        
        performanceData.push({
          period: dayStart.toISOString().split('T')[0],
          mileage: Math.round(dailyMileage),
          fuelConsumption: Number(dailyFuelConsumption.toFixed(1)),
          alerts: (dayAlerts || []).length,
          utilization: Number(utilization.toFixed(2))
        });
      }
      
      this.setCachedData(cacheKey, performanceData);
      console.log(`✅ Calculated ${performanceData.length} days of performance history`);
      return performanceData;
      
    } catch (error) {
      console.error('❌ Performance history calculation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to calculate performance history');
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Analytics cache cleared');
  }
}

export const analyticsService = new AnalyticsService();
