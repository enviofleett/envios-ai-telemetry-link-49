
import { supabase } from '@/integrations/supabase/client';
import { unifiedGeocodingService } from '@/services/geocoding/unifiedGeocodingService';
import { UserEmailTriggers } from '@/services/emailTriggers/userEmailTriggers';
import { haversineDistance } from '@/utils/geoUtils';
import type { VehicleParkingPattern } from '@/types/vehicle';

// This is an internal type for the service, not for export in types/vehicle.ts
interface PositionUpdate {
  deviceId: string;
  position: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    speed?: number;
    heading?: number;
  };
}

interface VehicleState {
  lastPosition: PositionUpdate;
  status: 'moving' | 'parked';
  parkingEventId?: string;
  lastMovedAt: Date;
}

const PARKING_THRESHOLD_MINUTES = 5;
const LOCATION_CHANGE_THRESHOLD_METERS = 50;
const NIGHT_PARKING_ANOMALY_DISTANCE_METERS = 200;
const NIGHT_START_HOUR = 18; // 6 PM
const NIGHT_END_HOUR = 6;   // 6 AM

class ParkingMonitorService {
  private static instance: ParkingMonitorService;
  private vehicleStates: Map<string, VehicleState> = new Map();

  static getInstance(): ParkingMonitorService {
    if (!ParkingMonitorService.instance) {
      ParkingMonitorService.instance = new ParkingMonitorService();
    }
    return ParkingMonitorService.instance;
  }
  
  public async processPositionUpdate(update: PositionUpdate): Promise<void> {
    const { deviceId, position } = update;
    const currentState = this.vehicleStates.get(deviceId);
    const now = new Date();

    if (!currentState) {
      this.vehicleStates.set(deviceId, {
        lastPosition: update,
        status: 'moving',
        lastMovedAt: now,
      });
      return;
    }

    const distance = haversineDistance(
      currentState.lastPosition.position.latitude,
      currentState.lastPosition.position.longitude,
      position.latitude,
      position.longitude
    );

    if (distance > LOCATION_CHANGE_THRESHOLD_METERS) {
      // Vehicle is moving
      if (currentState.status === 'parked') {
        await this.handleUnparked(deviceId, currentState);
      }
      this.vehicleStates.set(deviceId, {
        ...currentState,
        lastPosition: update,
        status: 'moving',
        lastMovedAt: now,
        parkingEventId: undefined, // Clear parking event ID
      });
    } else {
      // Vehicle is stationary
      const stationaryDuration = (now.getTime() - currentState.lastMovedAt.getTime()) / (1000 * 60);

      if (currentState.status === 'moving' && stationaryDuration > PARKING_THRESHOLD_MINUTES) {
        const hour = now.getHours();
        const isNight = hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
        const parkingEventId = await this.handleParked(deviceId, position, isNight);

        this.vehicleStates.set(deviceId, {
          ...currentState,
          lastPosition: update,
          status: 'parked',
          parkingEventId: parkingEventId,
        });
      }
    }
  }

  private async handleParked(deviceId: string, position: PositionUpdate['position'], isNight: boolean): Promise<string | undefined> {
    console.log(`Vehicle ${deviceId} parked at ${position.latitude}, ${position.longitude}`);

    const { data, error } = await supabase
      .from('vehicle_parking_events')
      .insert({
        vehicle_device_id: deviceId,
        parked_at: new Date().toISOString(),
        latitude: position.latitude,
        longitude: position.longitude,
        is_night_parking: isNight,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`Failed to log parking event for ${deviceId}`, error);
      return;
    }

    if (isNight) {
      await this.analyzeNightParkingPattern(deviceId, position);
    }
    
    return data?.id;
  }

  private async handleUnparked(deviceId: string, state: VehicleState): Promise<void> {
    if (!state.parkingEventId) return;

    console.log(`Vehicle ${deviceId} unparked.`);

    const { data: parkedEvent, error } = await supabase
      .from('vehicle_parking_events')
      .select('parked_at')
      .eq('id', state.parkingEventId)
      .single();
    
    if (error || !parkedEvent) {
        console.error(`Could not find parking event ${state.parkingEventId} for vehicle ${deviceId}`);
        return;
    }
    
    const unparkedAt = new Date();
    const parkedAt = new Date(parkedEvent.parked_at);
    const durationMinutes = Math.round((unparkedAt.getTime() - parkedAt.getTime()) / (1000 * 60));

    await supabase
    .from('vehicle_parking_events')
    .update({
        unparked_at: unparkedAt.toISOString(),
        duration_minutes: durationMinutes,
    })
    .eq('id', state.parkingEventId);
  }

  private async analyzeNightParkingPattern(deviceId: string, position: PositionUpdate['position']): Promise<void> {
    const { data: patterns, error } = await supabase
      .from('vehicle_parking_patterns')
      .select('*')
      .eq('vehicle_device_id', deviceId);

    if (error) {
      console.error(`Failed to fetch parking patterns for ${deviceId}`, error);
      return;
    }

    let closestPattern: VehicleParkingPattern | null = null;
    let minDistance = Infinity;

    for (const pattern of patterns) {
      const distance = haversineDistance(
        position.latitude,
        position.longitude,
        pattern.latitude,
        pattern.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPattern = pattern;
      }
    }
    
    const address = await unifiedGeocodingService.reverseGeocode(position.latitude, position.longitude);

    if (closestPattern && minDistance <= NIGHT_PARKING_ANOMALY_DISTANCE_METERS) {
      // Known location, update count
      await supabase
        .from('vehicle_parking_patterns')
        .update({
          parking_count: closestPattern.parking_count + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', closestPattern.id);
    } else {
      // Anomaly detected or first night parking
      console.warn(`Unusual night parking for vehicle ${deviceId} at new location: ${address}`);
      UserEmailTriggers.notifyOfUnusualParking(deviceId, address);

      // Create a new pattern
      await supabase
        .from('vehicle_parking_patterns')
        .insert({
          vehicle_device_id: deviceId,
          latitude: position.latitude,
          longitude: position.longitude,
          address: address,
          last_seen_at: new Date().toISOString(),
        });
    }
  }
}

export const parkingMonitorService = ParkingMonitorService.getInstance();
