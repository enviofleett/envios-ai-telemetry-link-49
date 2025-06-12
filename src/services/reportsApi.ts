// Mock Reports API Service
import { 
  type VehicleData 
} from '@/services/unifiedVehicleData';
import type { VehicleUsageStats } from '@/types/reports';
import { supabase } from '@/integrations/supabase/client';

export interface ReportQuery {
  vehicleIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  reportType: string;
  status?: string;
  geofenceIds?: string[];
  alertTypes?: string[];
  limit?: number;
}

export interface TripReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startTime: string;
  endTime: string;
  duration: number; // seconds
  distance: number; // meters
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  fuelConsumed: number;
  idleTime: number;
  status: string;
}

export interface AlertReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  alertType: string;
  alertTime: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: { lat: number; lng: number };
  resolvedBy?: string;
  resolvedAt?: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

const calculateTripMetrics = (positions: any[]): Partial<TripReport> => {
  if (positions.length < 2) {
    return { distance: 0, averageSpeed: 0, maxSpeed: 0, duration: 0 };
  }

  let totalDistance = 0;
  let maxSpeed = 0;
  let totalIdleTime = 0;
  
  const startTime = new Date(positions[0].timestamp);
  const endTime = new Date(positions[positions.length - 1].timestamp);
  const duration = (endTime.getTime() - startTime.getTime()) / 1000; // seconds

  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    
    // Calculate distance using Haversine formula
    const lat1 = prev.lat * Math.PI / 180;
    const lat2 = curr.lat * Math.PI / 180;
    const deltaLat = (curr.lat - prev.lat) * Math.PI / 180;
    const deltaLng = (curr.lng - prev.lng) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = 6371000 * c; // Earth's radius in meters
    
    totalDistance += distance;
    maxSpeed = Math.max(maxSpeed, curr.speed || 0);
    
    // Count idle time (speed < 2 km/h for more than 5 minutes)
    if ((curr.speed || 0) < 2) {
      const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      if (timeDiff > 300) { // 5 minutes
        totalIdleTime += timeDiff;
      }
    }
  }

  const averageSpeed = duration > 0 ? (totalDistance / 1000) / (duration / 3600) : 0;

  return {
    distance: Math.round(totalDistance),
    averageSpeed: Math.round(averageSpeed),
    maxSpeed: Math.round(maxSpeed),
    duration: Math.round(duration),
    idleTime: Math.round(totalIdleTime)
  };
};

const generateTripReports = async (query: ReportQuery): Promise<TripReport[]> => {
  try {
    console.log('🚗 Generating trip reports with real data...');
    
    const dateFrom = query.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dateTo = query.dateTo || new Date();
    
    // Fetch vehicles and their position data
    let vehiclesQuery = supabase
      .from('vehicles')
      .select(`
        id,
        device_id,
        device_name,
        vehicle_telemetry!inner(
          timestamp,
          latitude,
          longitude,
          speed,
          course
        )
      `);
    
    if (query.vehicleIds && query.vehicleIds.length > 0) {
      vehiclesQuery = vehiclesQuery.in('device_id', query.vehicleIds);
    }
    
    const { data: vehicleData, error } = await vehiclesQuery
      .gte('vehicle_telemetry.timestamp', dateFrom.toISOString())
      .lte('vehicle_telemetry.timestamp', dateTo.toISOString())
      .order('vehicle_telemetry.timestamp', { ascending: true })
      .limit(query.limit || 100);

    if (error) {
      console.error('❌ Error fetching trip data:', error);
      throw new Error(`Failed to fetch trip data: ${error.message}`);
    }

    const reports: TripReport[] = [];
    
    for (const vehicle of vehicleData || []) {
      if (!vehicle.vehicle_telemetry || vehicle.vehicle_telemetry.length === 0) continue;
      
      const positions = vehicle.vehicle_telemetry.map((t: any) => ({
        timestamp: t.timestamp,
        lat: t.latitude,
        lng: t.longitude,
        speed: t.speed
      }));
      
      const metrics = calculateTripMetrics(positions);
      const estimatedFuelConsumed = (metrics.distance || 0) / 1000 * 0.08; // 8L/100km estimate
      
      reports.push({
        id: `trip-${vehicle.device_id}-${Date.now()}`,
        vehicleId: vehicle.device_id,
        vehicleName: vehicle.device_name,
        startTime: positions[0]?.timestamp || dateFrom.toISOString(),
        endTime: positions[positions.length - 1]?.timestamp || dateTo.toISOString(),
        duration: metrics.duration || 0,
        distance: metrics.distance || 0,
        averageSpeed: metrics.averageSpeed || 0,
        maxSpeed: metrics.maxSpeed || 0,
        fuelConsumed: Number(estimatedFuelConsumed.toFixed(2)),
        idleTime: metrics.idleTime || 0,
        status: 'completed'
      });
    }
    
    console.log(`✅ Generated ${reports.length} trip reports`);
    return reports;
    
  } catch (error) {
    console.error('❌ Trip report generation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate trip reports');
  }
};

const generateGeofenceReports = async (query: ReportQuery): Promise<any[]> => {
  console.warn('🚧 Geofence reports not yet implemented - using mock data');
  return [];
};

const generateMaintenanceReports = async (query: ReportQuery): Promise<any[]> => {
  console.warn('🚧 Maintenance reports not yet implemented - using mock data');
  return [];
};

const generateAlertReports = async (query: ReportQuery): Promise<AlertReport[]> => {
  try {
    console.log('🚨 Generating alert reports with real data...');
    
    const dateFrom = query.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dateTo = query.dateTo || new Date();
    
    // Fetch alert data from database
    let alertsQuery = supabase
      .from('vehicle_alerts')
      .select(`
        id,
        vehicle_id,
        alert_type,
        severity,
        description,
        latitude,
        longitude,
        created_at,
        resolved_at,
        resolved_by,
        status,
        vehicles!inner(device_name)
      `);
    
    if (query.vehicleIds && query.vehicleIds.length > 0) {
      alertsQuery = alertsQuery.in('vehicle_id', query.vehicleIds);
    }
    
    if (query.alertTypes && query.alertTypes.length > 0) {
      alertsQuery = alertsQuery.in('alert_type', query.alertTypes);
    }
    
    const { data: alertData, error } = await alertsQuery
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString())
      .order('created_at', { ascending: false })
      .limit(query.limit || 100);

    if (error) {
      console.error('❌ Error fetching alert data:', error);
      throw new Error(`Failed to fetch alert data: ${error.message}`);
    }

    const reports: AlertReport[] = (alertData || []).map((alert: any) => ({
      id: alert.id,
      vehicleId: alert.vehicle_id,
      vehicleName: alert.vehicles?.device_name || 'Unknown Vehicle',
      alertType: alert.alert_type,
      alertTime: alert.created_at,
      severity: alert.severity || 'medium',
      description: alert.description || 'No description available',
      location: {
        lat: alert.latitude || 0,
        lng: alert.longitude || 0
      },
      resolvedBy: alert.resolved_by,
      resolvedAt: alert.resolved_at,
      status: alert.status || 'active'
    }));
    
    console.log(`✅ Generated ${reports.length} alert reports`);
    return reports;
    
  } catch (error) {
    console.error('❌ Alert report generation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate alert reports');
  }
};

const getVehicleUsageStats = async (vehicleIds?: string[]): Promise<VehicleUsageStats[]> => {
  try {
    console.log('📊 Calculating real vehicle usage statistics...');
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    let vehiclesQuery = supabase
      .from('vehicles')
      .select(`
        device_id,
        device_name,
        vehicle_telemetry(
          timestamp,
          latitude,
          longitude,
          speed,
          fuel_level
        )
      `);
    
    if (vehicleIds && vehicleIds.length > 0) {
      vehiclesQuery = vehiclesQuery.in('device_id', vehicleIds);
    }
    
    const { data: vehicleData, error } = await vehiclesQuery
      .gte('vehicle_telemetry.timestamp', thirtyDaysAgo.toISOString())
      .order('vehicle_telemetry.timestamp', { ascending: true });

    if (error) {
      console.error('❌ Error fetching usage data:', error);
      throw new Error(`Failed to fetch usage data: ${error.message}`);
    }

    const statsPromises = (vehicleData || []).map(async (vehicle: any) => {
      const telemetry = vehicle.vehicle_telemetry || [];
      
      if (telemetry.length === 0) {
        return {
          totalMileage: 0,
          fuelEfficiency: 0,
          averageSpeed: 0,
          utilizationRate: 0,
          maintenanceScore: 85,
          totalTrips: 0,
          idleTime: 0,
          totalFuelConsumed: 0
        };
      }
      
      // Calculate total distance
      let totalDistance = 0;
      let totalMovingTime = 0;
      let totalIdleTime = 0;
      let speedSum = 0;
      let speedCount = 0;
      let trips = 0;
      let lastMoving = false;
      
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
        const distance = 6371 * c; // Distance in km
        
        totalDistance += distance;
        
        const speed = curr.speed || 0;
        const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60 * 60); // hours
        
        if (speed > 2) { // Moving
          totalMovingTime += timeDiff;
          speedSum += speed;
          speedCount++;
          
          if (!lastMoving) {
            trips++;
            lastMoving = true;
          }
        } else { // Idle
          totalIdleTime += timeDiff;
          lastMoving = false;
        }
      }
      
      const averageSpeed = speedCount > 0 ? speedSum / speedCount : 0;
      const totalHours = totalMovingTime + totalIdleTime;
      const utilizationRate = totalHours > 0 ? totalMovingTime / totalHours : 0;
      
      // Estimate fuel consumption (8L/100km baseline)
      const estimatedFuelConsumed = totalDistance * 0.08;
      const fuelEfficiency = estimatedFuelConsumed > 0 ? totalDistance / estimatedFuelConsumed : 0;
      
      // Calculate maintenance score based on usage patterns
      const maintenanceScore = Math.max(50, 100 - (totalDistance / 100) - (totalIdleTime * 2));
      
      return {
        totalMileage: Math.round(totalDistance),
        fuelEfficiency: Number(fuelEfficiency.toFixed(1)),
        averageSpeed: Math.round(averageSpeed),
        utilizationRate: Number(utilizationRate.toFixed(2)),
        maintenanceScore: Math.round(maintenanceScore),
        totalTrips: trips,
        idleTime: Math.round(totalIdleTime),
        totalFuelConsumed: Number(estimatedFuelConsumed.toFixed(1))
      };
    });
    
    const stats = await Promise.all(statsPromises);
    console.log(`✅ Calculated usage stats for ${stats.length} vehicles`);
    return stats;
    
  } catch (error) {
    console.error('❌ Usage stats calculation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to calculate usage statistics');
  }
};

const exportReportData = async (reportType: string, reportData: any[]): Promise<string> => {
  try {
    if (reportData.length === 0) {
      throw new Error('No data to export');
    }
    
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : String(value)
      ).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to export data');
  }
};

export const reportsApi = {
  generateTripReports,
  generateGeofenceReports,
  generateMaintenanceReports,
  generateAlertReports,
  getVehicleUsageStats,
  exportReportData,
};
