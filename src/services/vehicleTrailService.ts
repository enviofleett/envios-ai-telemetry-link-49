import { supabase } from '@/integrations/supabase/client';

export interface TrailPoint {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface VehicleTrail {
  id: string;
  vehicle_id: string;
  device_id: string;
  trail_points: TrailPoint[];
  start_time: string;
  end_time: string;
  total_distance: number;
  total_duration_minutes: number;
  created_at: string;
}

export interface TrailOptions {
  deviceId?: string;
  vehicleId?: string;
  startTime?: Date;
  endTime?: Date;
  maxPoints?: number;
  simplifyTolerance?: number;
}

class VehicleTrailService {
  private static instance: VehicleTrailService;

  static getInstance(): VehicleTrailService {
    if (!VehicleTrailService.instance) {
      VehicleTrailService.instance = new VehicleTrailService();
    }
    return VehicleTrailService.instance;
  }

  // Helper function to safely parse JSON data to TrailPoint array
  private parseTrailPoints(jsonData: unknown): TrailPoint[] {
    if (!Array.isArray(jsonData)) {
      console.warn('Trail points data is not an array:', jsonData);
      return [];
    }

    return jsonData
      .map((item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          
          // Validate required properties
          if (
            typeof obj.latitude === 'number' &&
            typeof obj.longitude === 'number' &&
            (typeof obj.timestamp === 'string' || typeof obj.timestamp === 'number')
          ) {
            return {
              latitude: obj.latitude,
              longitude: obj.longitude,
              speed: typeof obj.speed === 'number' ? obj.speed : undefined,
              heading: typeof obj.heading === 'number' ? obj.heading : undefined,
              timestamp: String(obj.timestamp)
            } as TrailPoint;
          }
        }
        
        console.warn('Invalid trail point data:', item);
        return null;
      })
      .filter((point): point is TrailPoint => point !== null);
  }

  async getVehiclePositions(options: TrailOptions): Promise<TrailPoint[]> {
    try {
      let query = supabase
        .from('vehicle_positions')
        .select('device_id, latitude, longitude, speed, heading, timestamp')
        .order('timestamp', { ascending: true });

      if (options.deviceId) {
        query = query.eq('device_id', options.deviceId);
      }

      if (options.vehicleId) {
        query = query.eq('vehicle_id', options.vehicleId);
      }

      if (options.startTime) {
        query = query.gte('timestamp', options.startTime.toISOString());
      }

      if (options.endTime) {
        query = query.lte('timestamp', options.endTime.toISOString());
      }

      if (options.maxPoints) {
        query = query.limit(options.maxPoints);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching vehicle positions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVehiclePositions:', error);
      throw error;
    }
  }

  async getVehicleTrail(deviceId: string, hours: number = 6): Promise<TrailPoint[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    return this.getVehiclePositions({
      deviceId,
      startTime,
      endTime,
      maxPoints: 1000
    });
  }

  async createTrailFromPositions(deviceId: string, positions: TrailPoint[]): Promise<string | null> {
    if (positions.length < 2) {
      return null;
    }

    try {
      // Get vehicle ID from device ID
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('gp51_device_id', deviceId)
        .single();

      if (!vehicle) {
        console.warn(`No vehicle found for device ID: ${deviceId}`);
        return null;
      }

      const startTime = positions[0].timestamp;
      const endTime = positions[positions.length - 1].timestamp;
      const totalDistance = this.calculateTotalDistance(positions);
      const totalDuration = Math.floor(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)
      );

      const { data, error } = await supabase
        .from('vehicle_trails')
        .insert({
          vehicle_id: vehicle.id,
          device_id: deviceId,
          trail_points: positions,
          start_time: startTime,
          end_time: endTime,
          total_distance: totalDistance,
          total_duration_minutes: totalDuration
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating trail:', error);
        throw error;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in createTrailFromPositions:', error);
      throw error;
    }
  }

  async getStoredTrails(deviceId: string, days: number = 7): Promise<VehicleTrail[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('vehicle_trails')
        .select('*')
        .eq('device_id', deviceId)
        .gte('start_time', cutoffDate.toISOString())
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching stored trails:', error);
        throw error;
      }

      return (data || []).map(trail => ({
        ...trail,
        trail_points: this.parseTrailPoints(trail.trail_points)
      }));
    } catch (error) {
      console.error('Error in getStoredTrails:', error);
      throw error;
    }
  }

  simplifyTrail(points: TrailPoint[], tolerance: number = 0.0001): TrailPoint[] {
    if (points.length <= 2) return points;

    // Simple Douglas-Peucker algorithm implementation
    return this.douglasPeucker(points, tolerance);
  }

  private douglasPeucker(points: TrailPoint[], tolerance: number): TrailPoint[] {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let maxIndex = 0;
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    // Find the point with maximum distance from the line between first and last
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.pointToLineDistance(
        points[i],
        firstPoint,
        lastPoint
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    // If the maximum distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const leftPart = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const rightPart = this.douglasPeucker(points.slice(maxIndex), tolerance);
      
      // Combine results, removing duplicate point at the join
      return leftPart.slice(0, -1).concat(rightPart);
    } else {
      // If no point exceeds tolerance, return just the endpoints
      return [firstPoint, lastPoint];
    }
  }

  private pointToLineDistance(point: TrailPoint, lineStart: TrailPoint, lineEnd: TrailPoint): number {
    const A = lineEnd.latitude - lineStart.latitude;
    const B = lineStart.longitude - lineEnd.longitude;
    const C = lineEnd.longitude * lineStart.latitude - lineStart.longitude * lineEnd.latitude;
    
    return Math.abs(A * point.longitude + B * point.latitude + C) / Math.sqrt(A * A + B * B);
  }

  private calculateTotalDistance(points: TrailPoint[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      totalDistance += distance;
    }
    
    return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async cleanupOldPositions(daysToKeep: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('vehicle_positions')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error cleaning up old positions:', error);
        throw error;
      }

      console.log(`✅ Cleaned up vehicle positions older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Error in cleanupOldPositions:', error);
      throw error;
    }
  }
}

export const vehicleTrailService = VehicleTrailService.getInstance();
