
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface TrailPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface VehicleTrail {
  id: string;
  device_id: string;
  trail_points: TrailPoint[];
  start_time: string;
  end_time: string;
  total_distance?: number;
  total_duration_minutes?: number;
  created_at: string;
}

// Helper function to convert TrailPoint[] to Json
const convertTrailPointsToJson = (points: TrailPoint[]): Json => {
  return points.map(point => ({
    lat: point.lat,
    lng: point.lng,
    timestamp: point.timestamp,
    speed: point.speed || null,
    heading: point.heading || null,
    accuracy: point.accuracy || null
  })) as Json;
};

// Helper function to safely parse trail points from Json
const parseTrailPointsFromJson = (jsonData: Json): TrailPoint[] => {
  try {
    if (Array.isArray(jsonData)) {
      return jsonData.map(item => {
        if (typeof item === 'object' && item !== null) {
          const point = item as { [key: string]: any };
          return {
            lat: typeof point.lat === 'number' ? point.lat : 0,
            lng: typeof point.lng === 'number' ? point.lng : 0,
            timestamp: typeof point.timestamp === 'string' ? point.timestamp : new Date().toISOString(),
            speed: typeof point.speed === 'number' ? point.speed : undefined,
            heading: typeof point.heading === 'number' ? point.heading : undefined,
            accuracy: typeof point.accuracy === 'number' ? point.accuracy : undefined
          };
        }
        return {
          lat: 0,
          lng: 0,
          timestamp: new Date().toISOString()
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error parsing trail points from JSON:', error);
    return [];
  }
};

class VehicleTrailService {
  async getVehicleTrail(deviceId: string, hoursBack: number = 24): Promise<TrailPoint[]> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hoursBack);

      const { data, error } = await supabase
        .from('vehicle_trails')
        .select('trail_points, start_time, end_time')
        .eq('device_id', deviceId)
        .gte('start_time', startTime.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching vehicle trail:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Combine all trail points from different trail segments
      const allPoints: TrailPoint[] = [];
      for (const trail of data) {
        const points = parseTrailPointsFromJson(trail.trail_points);
        allPoints.push(...points);
      }

      // Sort by timestamp
      return allPoints.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    } catch (error) {
      console.error('Error in getVehicleTrail:', error);
      return [];
    }
  }

  async saveVehicleTrail(
    deviceId: string, 
    points: TrailPoint[], 
    vehicleId?: string
  ): Promise<string | null> {
    try {
      if (points.length === 0) {
        return null;
      }

      const startTime = points[0].timestamp;
      const endTime = points[points.length - 1].timestamp;
      const totalDistance = this.calculateTotalDistance(points);
      const totalDuration = this.calculateDuration(startTime, endTime);

      const { data, error } = await supabase
        .from('vehicle_trails')
        .insert({
          device_id: deviceId,
          trail_points: convertTrailPointsToJson(points),
          start_time: startTime,
          end_time: endTime,
          total_distance: totalDistance,
          total_duration_minutes: totalDuration
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving vehicle trail:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in saveVehicleTrail:', error);
      return null;
    }
  }

  async getTrailsForTimeRange(
    deviceId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<VehicleTrail[]> {
    try {
      const { data, error } = await supabase
        .from('vehicle_trails')
        .select('*')
        .eq('device_id', deviceId)
        .gte('start_time', startTime.toISOString())
        .lte('end_time', endTime.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching trails for time range:', error);
        return [];
      }

      return (data || []).map(trail => ({
        id: trail.id,
        device_id: trail.device_id,
        trail_points: parseTrailPointsFromJson(trail.trail_points),
        start_time: trail.start_time,
        end_time: trail.end_time,
        total_distance: trail.total_distance,
        total_duration_minutes: trail.total_duration_minutes,
        created_at: trail.created_at
      }));

    } catch (error) {
      console.error('Error in getTrailsForTimeRange:', error);
      return [];
    }
  }

  simplifyTrail(points: TrailPoint[], tolerance: number = 0.0001): TrailPoint[] {
    if (points.length <= 2) return points;

    // Douglas-Peucker algorithm for line simplification
    const douglasPeucker = (points: TrailPoint[], tolerance: number): TrailPoint[] => {
      if (points.length <= 2) return points;

      let maxDistance = 0;
      let maxIndex = 0;
      const end = points.length - 1;

      for (let i = 1; i < end; i++) {
        const distance = this.perpendicularDistance(
          points[i],
          points[0],
          points[end]
        );
        if (distance > maxDistance) {
          maxDistance = distance;
          maxIndex = i;
        }
      }

      if (maxDistance > tolerance) {
        const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
        const right = douglasPeucker(points.slice(maxIndex), tolerance);
        return [...left.slice(0, -1), ...right];
      } else {
        return [points[0], points[end]];
      }
    };

    return douglasPeucker(points, tolerance);
  }

  private perpendicularDistance(
    point: TrailPoint,
    lineStart: TrailPoint,
    lineEnd: TrailPoint
  ): number {
    const A = point.lat - lineStart.lat;
    const B = point.lng - lineStart.lng;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lng - lineStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    const param = dot / lenSq;
    let xx: number, yy: number;

    if (param < 0) {
      xx = lineStart.lat;
      yy = lineStart.lng;
    } else if (param > 1) {
      xx = lineEnd.lat;
      yy = lineEnd.lng;
    } else {
      xx = lineStart.lat + param * C;
      yy = lineStart.lng + param * D;
    }

    const dx = point.lat - xx;
    const dy = point.lng - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateTotalDistance(points: TrailPoint[]): number {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistance += this.haversineDistance(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng
      );
    }

    return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Minutes
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getActiveTrails(deviceIds: string[]): Promise<Map<string, TrailPoint[]>> {
    const trails = new Map<string, TrailPoint[]>();
    
    const promises = deviceIds.map(async (deviceId) => {
      const points = await this.getVehicleTrail(deviceId, 6); // Last 6 hours
      if (points.length > 0) {
        trails.set(deviceId, points);
      }
    });

    await Promise.allSettled(promises);
    return trails;
  }

  async deleteOldTrails(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('vehicle_trails')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Error deleting old trails:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in deleteOldTrails:', error);
      return 0;
    }
  }
}

export const vehicleTrailService = new VehicleTrailService();
