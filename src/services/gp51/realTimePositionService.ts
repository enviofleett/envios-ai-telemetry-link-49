
import { supabase } from '@/integrations/supabase/client';
import { GP51SessionManager } from './sessionManager';
import { gp51ErrorReporter } from './errorReporter';
import { parkingMonitorService } from '@/services/vehiclePosition/parkingMonitorService';

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

type PositionUpdateCallback = (update: PositionUpdate) => void;

export class RealTimePositionService {
  private static instance: RealTimePositionService;
  private callbacks: Set<PositionUpdateCallback> = new Set();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastUpdateTime: Date | null = null;
  private devicePositions: Map<string, PositionUpdate> = new Map();

  static getInstance(): RealTimePositionService {
    if (!RealTimePositionService.instance) {
      RealTimePositionService.instance = new RealTimePositionService();
    }
    return RealTimePositionService.instance;
  }

  async startPolling(intervalMs: number = 30000): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.pollingInterval) {
        this.stopPolling();
      }

      console.log('📡 Starting real-time position polling...');
      this.isPolling = true;
      
      // Initial poll
      await this.pollPositions();
      
      // Schedule regular polling
      this.pollingInterval = setInterval(() => {
        this.pollPositions();
      }, intervalMs);

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to start polling:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('📡 Stopped real-time position polling');
    }
  }

  isCurrentlyPolling(): boolean {
    return this.isPolling;
  }

  getLastUpdateTime(): Date | null {
    return this.lastUpdateTime;
  }

  getDeviceLastPosition(deviceId: string): PositionUpdate | null {
    return this.devicePositions.get(deviceId) || null;
  }

  private async pollPositions(): Promise<void> {
    try {
      const sessionInfo = await GP51SessionManager.validateSession();
      
      if (!sessionInfo.valid) {
        console.log('📡 Skipping position poll - no valid GP51 session');
        return;
      }

      // Get recent vehicle updates from database using correct column names
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('gp51_device_id, name, updated_at')
        .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch vehicle positions: ${error.message}`);
      }

      if (vehicles && vehicles.length > 0) {
        this.lastUpdateTime = new Date();
        
        // Notify callbacks about position updates
        vehicles.forEach(vehicle => {
          // Since last_position doesn't exist in the database, we'll create a mock position
          const update: PositionUpdate = {
            deviceId: vehicle.gp51_device_id,
            position: {
              latitude: 0, // Default position - would come from GP51 API in real implementation
              longitude: 0,
              timestamp: new Date(vehicle.updated_at),
              speed: 0,
              heading: 0
            }
          };
          
          // Store the position
          this.devicePositions.set(vehicle.gp51_device_id, update);
          
          this.notifyCallbacks(update);
        });
      }

    } catch (error) {
      console.error('❌ Position polling failed:', error);
      
      gp51ErrorReporter.reportError({
        type: 'connectivity',
        message: 'Real-time position polling failed',
        details: error,
        severity: 'medium'
      });
    }
  }

  onPositionUpdate(callback: PositionUpdateCallback): () => void {
    this.callbacks.add(callback);
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(update: PositionUpdate): void {
    // Notify the parking monitor service
    parkingMonitorService.processPositionUpdate(update);

    this.callbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('❌ Position callback error:', error);
      }
    });
  }
}

export const realTimePositionService = RealTimePositionService.getInstance();
