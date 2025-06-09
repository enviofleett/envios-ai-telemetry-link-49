
import { supabase } from '@/integrations/supabase/client';
import { enhancedGP51SessionManager } from './enhancedGP51SessionManager';
import { gp51ApiService } from './gp51ApiService';

interface PositionUpdate {
  deviceid: string;
  devicetime: number;
  arrivedtime: number;
  updatetime: number;
  validpoistiontime: number;
  callat: number;
  callon: number;
  altitude: number;
  radius: number;
  speed: number;
  course: number;
  totaldistance: number;
  status: number;
  strstatus: string;
  strstatusen: string;
  alarm: number;
  stralarm: string;
  gotsrc: string;
  rxlevel: number;
  gpsvalidnum: number;
  moving: number;
  parktime: number;
  parkduration: number;
}

export class RealTimePositionService {
  private static instance: RealTimePositionService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastQueryTime: number = 0;
  private isPolling: boolean = false;
  private readonly POLLING_INTERVAL = 30000; // 30 seconds
  private positionUpdateCallbacks: ((positions: PositionUpdate[]) => void)[] = [];

  private constructor() {}

  static getInstance(): RealTimePositionService {
    if (!RealTimePositionService.instance) {
      RealTimePositionService.instance = new RealTimePositionService();
    }
    return RealTimePositionService.instance;
  }

  async startPolling(): Promise<{ success: boolean; error?: string }> {
    if (this.isPolling) {
      return { success: true };
    }

    console.log('Starting real-time position polling...');

    // Check if we have a valid session
    if (!enhancedGP51SessionManager.isSessionValid()) {
      const restoreResult = await enhancedGP51SessionManager.restoreSession();
      if (!restoreResult) {
        return { success: false, error: 'No valid GP51 session available' };
      }
    }

    this.isPolling = true;
    
    // Initial fetch
    await this.fetchPositions();

    // Set up polling interval
    this.pollingInterval = setInterval(async () => {
      await this.fetchPositions();
    }, this.POLLING_INTERVAL);

    return { success: true };
  }

  stopPolling(): void {
    console.log('Stopping real-time position polling...');
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.isPolling = false;
  }

  private async fetchPositions(): Promise<void> {
    try {
      const token = enhancedGP51SessionManager.getToken();
      if (!token) {
        console.error('No GP51 token available for position fetch');
        this.stopPolling();
        return;
      }

      const result = await gp51ApiService.getLastPositions();
      
      if (result.success && result.positions) {
        // Update last query time for next request
        this.lastQueryTime = Date.now();
        
        // Store positions in database for caching
        await this.storePositionsInDatabase(result.positions);
        
        // Notify all listeners
        this.notifyPositionUpdate(result.positions);
        
        console.log(`Successfully fetched ${result.positions.length} position updates`);
      } else {
        console.error('Failed to fetch positions:', result.error);
        
        // If authentication failed, try to refresh session
        if (result.error?.includes('authentication') || result.error?.includes('token')) {
          console.log('Attempting to refresh GP51 session...');
          const refreshResult = await enhancedGP51SessionManager.restoreSession();
          if (!refreshResult) {
            this.stopPolling();
          }
        }
      }
    } catch (error) {
      console.error('Error in position polling:', error);
    }
  }

  private async storePositionsInDatabase(positions: PositionUpdate[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Prepare position data for storage
      const positionRecords = positions.map(position => ({
        device_id: position.deviceid,
        latitude: position.callat / 1000000, // Convert from microdegrees
        longitude: position.callon / 1000000, // Convert from microdegrees
        speed: position.speed,
        course: position.course,
        altitude: position.altitude,
        gps_time: new Date(position.devicetime * 1000).toISOString(),
        server_time: new Date(position.arrivedtime * 1000).toISOString(),
        status: position.status,
        status_text: position.strstatus,
        alarm: position.alarm,
        alarm_text: position.stralarm,
        total_distance: position.totaldistance,
        created_at: new Date().toISOString()
      }));

      // Store in position_logs table (create if needed)
      const { error } = await supabase
        .from('position_logs')
        .upsert(positionRecords, {
          onConflict: 'device_id,gps_time'
        });

      if (error) {
        console.error('Failed to store positions in database:', error);
      }
    } catch (error) {
      console.error('Error storing positions:', error);
    }
  }

  onPositionUpdate(callback: (positions: PositionUpdate[]) => void): () => void {
    this.positionUpdateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.positionUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.positionUpdateCallbacks.splice(index, 1);
      }
    };
  }

  private notifyPositionUpdate(positions: PositionUpdate[]): void {
    this.positionUpdateCallbacks.forEach(callback => {
      try {
        callback(positions);
      } catch (error) {
        console.error('Error in position update callback:', error);
      }
    });
  }

  async getDeviceLastPosition(deviceId: string): Promise<PositionUpdate | null> {
    try {
      const result = await gp51ApiService.getLastPositions([deviceId]);
      
      if (result.success && result.positions && result.positions.length > 0) {
        return result.positions[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching device position:', error);
      return null;
    }
  }

  isCurrentlyPolling(): boolean {
    return this.isPolling;
  }

  getPollingInterval(): number {
    return this.POLLING_INTERVAL;
  }
}

export const realTimePositionService = RealTimePositionService.getInstance();
