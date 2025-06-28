import { supabase } from '@/integrations/supabase/client';

export interface RealTimeDeviceData {
  deviceId: string;
  deviceName: string;
  position: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    altitude?: number;
    timestamp: Date;
    isMoving: boolean;
  };
  status: {
    online: boolean;
    battery?: number;
    signal?: number;
    satellites?: number;
  };
  analytics: {
    totalDistance: number;
    averageSpeed: number;
    maxSpeed: number;
    idleTime: number;
    drivingTime: number;
  };
}

export interface ProcessingMetrics {
  processedCount: number;
  errorCount: number;
  averageProcessingTime: number;
  lastProcessedAt: Date;
  throughputPerMinute: number;
}

export class RealTimeDataProcessor {
  private static instance: RealTimeDataProcessor;
  private processingQueue: Map<string, any[]> = new Map();
  private metrics: ProcessingMetrics = {
    processedCount: 0,
    errorCount: 0,
    averageProcessingTime: 0,
    lastProcessedAt: new Date(),
    throughputPerMinute: 0
  };
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  static getInstance(): RealTimeDataProcessor {
    if (!RealTimeDataProcessor.instance) {
      RealTimeDataProcessor.instance = new RealTimeDataProcessor();
    }
    return RealTimeDataProcessor.instance;
  }

  async startProcessing(intervalMs: number = 5000): Promise<void> {
    if (this.isProcessing) {
      console.log('⚠️ Real-time processing already active');
      return;
    }

    this.isProcessing = true;
    console.log('🚀 Starting real-time data processing...');

    this.processingInterval = setInterval(async () => {
      await this.processQueuedData();
    }, intervalMs);
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    console.log('⏸️ Real-time processing stopped');
  }

  queueDeviceData(deviceId: string, rawData: any): void {
    if (!this.processingQueue.has(deviceId)) {
      this.processingQueue.set(deviceId, []);
    }
    
    const queue = this.processingQueue.get(deviceId)!;
    queue.push({
      ...rawData,
      queuedAt: new Date()
    });

    // Keep queue size manageable
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100);
    }
  }

  private async processQueuedData(): Promise<void> {
    if (this.processingQueue.size === 0) {
      return;
    }

    const startTime = Date.now();
    let processedInBatch = 0;
    let errorsInBatch = 0;

    console.log(`📊 Processing ${this.processingQueue.size} device queues...`);

    for (const [deviceId, dataQueue] of this.processingQueue.entries()) {
      if (dataQueue.length === 0) continue;

      try {
        const processedData = await this.transformRawData(deviceId, dataQueue);
        await this.storeProcessedData(processedData);
        
        processedInBatch += dataQueue.length;
        dataQueue.length = 0; // Clear processed data
      } catch (error) {
        console.error(`❌ Error processing data for device ${deviceId}:`, error);
        errorsInBatch++;
        
        // Keep only recent failed data to retry later
        if (dataQueue.length > 10) {
          dataQueue.splice(0, dataQueue.length - 10);
        }
      }
    }

    // Update metrics
    const processingTime = Date.now() - startTime;
    this.updateMetrics(processedInBatch, errorsInBatch, processingTime);

    if (processedInBatch > 0) {
      console.log(`✅ Processed ${processedInBatch} records in ${processingTime}ms`);
    }
  }

  private async transformRawData(deviceId: string, rawDataArray: any[]): Promise<RealTimeDeviceData> {
    const latestData = rawDataArray[rawDataArray.length - 1];
    
    // Calculate analytics from the data array
    const speeds = rawDataArray.map(d => d.speed || 0).filter(s => s > 0);
    const totalDistance = this.calculateTotalDistance(rawDataArray);
    const { idleTime, drivingTime } = this.calculateTimeDurations(rawDataArray);

    return {
      deviceId,
      deviceName: latestData.devicename || latestData.deviceName || `Device ${deviceId}`,
      position: {
        latitude: parseFloat(latestData.latitude || latestData.lat || 0),
        longitude: parseFloat(latestData.longitude || latestData.lng || 0),
        speed: parseFloat(latestData.speed || 0),
        course: parseInt(latestData.course || latestData.heading || 0),
        altitude: latestData.altitude ? parseFloat(latestData.altitude) : undefined,
        timestamp: new Date(latestData.devicetime || latestData.timestamp || Date.now()),
        isMoving: (latestData.speed || 0) > 2 // Consider moving if speed > 2 km/h
      },
      status: {
        online: latestData.status === 0 || latestData.online === true,
        battery: latestData.battery ? parseInt(latestData.battery) : undefined,
        signal: latestData.signal ? parseInt(latestData.signal) : undefined,
        satellites: latestData.satellites ? parseInt(latestData.satellites) : undefined
      },
      analytics: {
        totalDistance,
        averageSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
        maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
        idleTime,
        drivingTime
      }
    };
  }

  private calculateTotalDistance(dataArray: any[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < dataArray.length; i++) {
      const prev = dataArray[i - 1];
      const curr = dataArray[i];
      
      if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
        const distance = this.haversineDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        );
        totalDistance += distance;
      }
    }
    
    return totalDistance;
  }

  private calculateTimeDurations(dataArray: any[]): { idleTime: number; drivingTime: number } {
    let idleTime = 0;
    let drivingTime = 0;
    
    for (let i = 1; i < dataArray.length; i++) {
      const prev = dataArray[i - 1];
      const curr = dataArray[i];
      
      const timeDiff = new Date(curr.devicetime || curr.timestamp).getTime() - 
                      new Date(prev.devicetime || prev.timestamp).getTime();
      
      if (timeDiff > 0 && timeDiff < 5 * 60 * 1000) { // Only count if less than 5 minutes
        const timeInMinutes = timeDiff / (1000 * 60);
        
        if ((curr.speed || 0) > 2) {
          drivingTime += timeInMinutes;
        } else {
          idleTime += timeInMinutes;
        }
      }
    }
    
    return { idleTime, drivingTime };
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  private async storeProcessedData(data: RealTimeDeviceData): Promise<void> {
    try {
      // Store in live_positions table
      const { error: positionError } = await supabase
        .from('live_positions')
        .upsert({
          device_id: data.deviceId,
          latitude: data.position.latitude,
          longitude: data.position.longitude,
          speed: data.position.speed,
          course: data.position.course,
          altitude: data.position.altitude,
          position_timestamp: data.position.timestamp.toISOString(),
          is_moving: data.position.isMoving,
          status_code: data.status.online ? 0 : 1,
          battery_level: data.status.battery,
          signal_strength: data.status.signal,
          satellite_count: data.status.satellites,
          total_distance: data.analytics.totalDistance,
          average_speed: data.analytics.averageSpeed,
          max_speed: data.analytics.maxSpeed,
          idle_time_minutes: data.analytics.idleTime,
          driving_time_minutes: data.analytics.drivingTime
        }, {
          onConflict: 'device_id'
        });

      if (positionError) {
        throw positionError;
      }

      // Update device status
      const { error: deviceError } = await supabase
        .from('gp51_devices')
        .update({
          last_position_time: data.position.timestamp.toISOString(),
          is_online: data.status.online,
          last_active_time: new Date().toISOString()
        })
        .eq('device_id', data.deviceId);

      if (deviceError) {
        console.error('Error updating device status:', deviceError);
      }

    } catch (error) {
      console.error('Error storing processed data:', error);
      throw error;
    }
  }

  private updateMetrics(processed: number, errors: number, processingTime: number): void {
    this.metrics.processedCount += processed;
    this.metrics.errorCount += errors;
    this.metrics.lastProcessedAt = new Date();
    
    // Update average processing time (simple moving average)
    const currentAvg = this.metrics.averageProcessingTime;
    this.metrics.averageProcessingTime = currentAvg === 0 ? 
      processingTime : (currentAvg + processingTime) / 2;
    
    // Calculate throughput (processed records per minute)
    this.metrics.throughputPerMinute = processed / (processingTime / 60000);
  }

  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  getQueueStatus(): { deviceId: string; queueSize: number }[] {
    return Array.from(this.processingQueue.entries()).map(([deviceId, queue]) => ({
      deviceId,
      queueSize: queue.length
    }));
  }
}

export const realTimeDataProcessor = RealTimeDataProcessor.getInstance();
