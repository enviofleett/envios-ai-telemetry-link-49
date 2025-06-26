
import { supabase } from '@/integrations/supabase/client';
import type { GP51ProcessedPosition } from '@/types/gp51';

export interface LivePositionData {
  device_id: string;
  position_data: any;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude?: number;
  accuracy_radius?: number;
  position_timestamp: string;
  server_timestamp?: string;
  status_code?: number;
  status_description?: string;
  alarm_code?: number;
  alarm_description?: string;
  location_source?: string;
  signal_strength?: number;
  gps_satellite_count?: number;
  voltage?: number;
  fuel_level?: number;
  temperature?: number;
  is_moving: boolean;
  parking_duration?: number;
  total_distance?: number;
  report_mode?: number;
}

export class LivePositionService {
  private static instance: LivePositionService;

  private constructor() {}

  static getInstance(): LivePositionService {
    if (!LivePositionService.instance) {
      LivePositionService.instance = new LivePositionService();
    }
    return LivePositionService.instance;
  }

  async storePosition(positionData: GP51ProcessedPosition): Promise<void> {
    try {
      const livePosition: LivePositionData = {
        device_id: positionData.deviceId,
        position_data: positionData as any,
        latitude: positionData.latitude,
        longitude: positionData.longitude,
        speed: positionData.speed,
        course: positionData.course,
        position_timestamp: positionData.timestamp.toISOString(),
        server_timestamp: new Date().toISOString(),
        status_code: positionData.status,
        status_description: positionData.statusText,
        is_moving: positionData.isMoving,
        location_source: 'gps'
      };

      const { error } = await supabase
        .from('live_positions')
        .upsert(livePosition, { 
          onConflict: 'device_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error storing live position:', error);
        throw error;
      }

      console.log(`Live position stored for device ${positionData.deviceId}`);
    } catch (error) {
      console.error('Error in storePosition:', error);
      throw error;
    }
  }

  async batchStorePositions(positions: GP51ProcessedPosition[]): Promise<void> {
    try {
      const livePositions: LivePositionData[] = positions.map(position => ({
        device_id: position.deviceId,
        position_data: position as any,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        course: position.course,
        position_timestamp: position.timestamp.toISOString(),
        server_timestamp: new Date().toISOString(),
        status_code: position.status,
        status_description: position.statusText,
        is_moving: position.isMoving,
        location_source: 'gps'
      }));

      const { error } = await supabase
        .from('live_positions')
        .upsert(livePositions, { 
          onConflict: 'device_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error batch storing live positions:', error);
        throw error;
      }

      console.log(`Batch stored ${positions.length} live positions`);
    } catch (error) {
      console.error('Error in batchStorePositions:', error);
      throw error;
    }
  }

  async getLatestPositions(deviceIds: string[]): Promise<Map<string, LivePositionData>> {
    try {
      const { data, error } = await supabase
        .from('live_positions')
        .select('*')
        .in('device_id', deviceIds)
        .order('position_timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching latest positions:', error);
        throw error;
      }

      const positionsMap = new Map<string, LivePositionData>();
      
      // Keep only the latest position for each device
      const latestPositions = new Map();
      (data || []).forEach(pos => {
        const existing = latestPositions.get(pos.device_id);
        if (!existing || new Date(pos.position_timestamp) > new Date(existing.position_timestamp)) {
          latestPositions.set(pos.device_id, pos);
        }
      });

      latestPositions.forEach((position, deviceId) => {
        positionsMap.set(deviceId, position as LivePositionData);
      });

      return positionsMap;
    } catch (error) {
      console.error('Error in getLatestPositions:', error);
      throw error;
    }
  }

  async getPositionHistory(deviceId: string, startTime: Date, endTime: Date): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('position_history')
        .select('*')
        .eq('device_id', deviceId)
        .gte('position_timestamp', startTime.toISOString())
        .lte('position_timestamp', endTime.toISOString())
        .order('position_timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching position history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPositionHistory:', error);
      throw error;
    }
  }

  async cleanupOldPositions(): Promise<void> {
    try {
      const { error } = await supabase.rpc('cleanup_old_positions');
      
      if (error) {
        console.error('Error cleaning up old positions:', error);
        throw error;
      }

      console.log('Old positions cleaned up successfully');
    } catch (error) {
      console.error('Error in cleanupOldPositions:', error);
      throw error;
    }
  }
}

export const livePositionService = LivePositionService.getInstance();
