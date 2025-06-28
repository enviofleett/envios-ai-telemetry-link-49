import { supabase } from '@/integrations/supabase/client';

interface QueuedPosition {
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude: number;
  position_timestamp: string;
  server_timestamp: string;
  status_code: number;
  is_moving: boolean;
  voltage?: number;
  fuel_level?: number;
  temperature?: number;
  signal_strength?: number;
  gps_satellite_count?: number;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
}

interface ProcessingMetrics {
  totalProcessed: number;
  successfulInserts: number;
  failedInserts: number;
  averageProcessingTime: number;
  queueSize: number;
  lastProcessedAt: Date;
}

export class RealTimeDataProcessor {
  private static instance: RealTimeDataProcessor;
  private processingQueue: QueuedPosition[] = [];
  private isProcessing = false;
  private metrics: ProcessingMetrics = {
    totalProcessed: 0,
    successfulInserts: 0,
    failedInserts: 0,
    averageProcessingTime: 0,
    queueSize: 0,
    lastProcessedAt: new Date()
  };
  private processingTimes: number[] = [];
  private subscribers: Array<(metrics: ProcessingMetrics) => void> = [];

  static getInstance(): RealTimeDataProcessor {
    if (!RealTimeDataProcessor.instance) {
      RealTimeDataProcessor.instance = new RealTimeDataProcessor();
    }
    return RealTimeDataProcessor.instance;
  }

  private constructor() {
    this.startProcessor();
    this.startMetricsUpdater();
  }

  addToQueue(positionData: any, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const queuedPosition: QueuedPosition = {
      device_id: positionData.deviceId || positionData.device_id,
      latitude: positionData.latitude,
      longitude: positionData.longitude,
      speed: positionData.speed,
      course: positionData.course || 0,
      altitude: positionData.altitude || 0,
      position_timestamp: positionData.timestamp || new Date().toISOString(),
      server_timestamp: new Date().toISOString(),
      status_code: positionData.status || 0,
      is_moving: positionData.isMoving || positionData.speed > 0,
      voltage: positionData.voltage,
      fuel_level: positionData.fuelLevel,
      temperature: positionData.temperature,
      signal_strength: positionData.signalStrength,
      gps_satellite_count: positionData.satellites,
      priority,
      retryCount: 0
    };

    // Insert based on priority
    if (priority === 'high') {
      this.processingQueue.unshift(queuedPosition);
    } else {
      this.processingQueue.push(queuedPosition);
    }

    this.updateMetrics();
  }

  batchAddToQueue(positionsData: any[], priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const queuedPositions: QueuedPosition[] = positionsData.map(positionData => ({
      device_id: positionData.deviceId || positionData.device_id,
      latitude: positionData.latitude,
      longitude: positionData.longitude,
      speed: positionData.speed,
      course: positionData.course || 0,
      altitude: positionData.altitude || 0,
      position_timestamp: positionData.timestamp || new Date().toISOString(),
      server_timestamp: new Date().toISOString(),
      status_code: positionData.status || 0,
      is_moving: positionData.isMoving || positionData.speed > 0,
      voltage: positionData.voltage,
      fuel_level: positionData.fuelLevel,
      temperature: positionData.temperature,
      signal_strength: positionData.signalStrength,
      gps_satellite_count: positionData.satellites,
      priority,
      retryCount: 0
    }));

    if (priority === 'high') {
      this.processingQueue.unshift(...queuedPositions);
    } else {
      this.processingQueue.push(...queuedPositions);
    }

    this.updateMetrics();
  }

  private async startProcessor(): Promise<void> {
    setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        await this.processQueue();
      }
    }, 1000); // Process every second
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const startTime = Date.now();

    try {
      const batchSize = Math.min(50, this.processingQueue.length);
      const batch = this.processingQueue.splice(0, batchSize);
      
      if (batch.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Process batch
      const results = await this.processBatch(batch);
      
      // Update metrics
      this.metrics.totalProcessed += batch.length;
      this.metrics.successfulInserts += results.successCount;
      this.metrics.failedInserts += results.failureCount;
      
      // Handle failed items - retry up to 3 times
      results.failed.forEach(item => {
        if (item.retryCount < 3) {
          item.retryCount++;
          this.processingQueue.push(item);
        }
      });

      const processingTime = Date.now() - startTime;
      this.processingTimes.push(processingTime);
      
      // Keep only last 100 processing times for average calculation
      if (this.processingTimes.length > 100) {
        this.processingTimes = this.processingTimes.slice(-100);
      }

      this.metrics.averageProcessingTime = 
        this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
      this.metrics.lastProcessedAt = new Date();

      console.log(`✅ Processed batch: ${results.successCount} success, ${results.failureCount} failed`);
      
    } catch (error) {
      console.error('❌ Queue processing error:', error);
    } finally {
      this.isProcessing = false;
      this.updateMetrics();
    }
  }

  private async processBatch(batch: QueuedPosition[]): Promise<{
    successCount: number;
    failureCount: number;
    failed: QueuedPosition[];
  }> {
    const results = {
      successCount: 0,
      failureCount: 0,
      failed: [] as QueuedPosition[]
    };

    try {
      // Transform data for live_positions table
      const positionData = batch.map(item => ({
        device_id: item.device_id,
        latitude: item.latitude,
        longitude: item.longitude,
        speed: item.speed,
        course: item.course,
        altitude: item.altitude,
        position_timestamp: item.position_timestamp,
        server_timestamp: item.server_timestamp,
        status_code: item.status_code,
        is_moving: item.is_moving,
        voltage: item.voltage,
        fuel_level: item.fuel_level,
        temperature: item.temperature,
        signal_strength: item.signal_strength,
        gps_satellite_count: item.gps_satellite_count
      }));

      const { data, error } = await supabase
        .from('live_positions')
        .upsert(positionData, { 
          onConflict: 'device_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Batch insert error:', error);
        results.failureCount = batch.length;
        results.failed = batch;
      } else {
        results.successCount = batch.length;
      }

    } catch (error) {
      console.error('Batch processing error:', error);
      results.failureCount = batch.length;
      results.failed = batch;
    }

    return results;
  }

  private updateMetrics(): void {
    this.metrics.queueSize = this.processingQueue.length;
    this.notifySubscribers();
  }

  private startMetricsUpdater(): void {
    setInterval(() => {
      this.notifySubscribers();
    }, 5000); // Update metrics every 5 seconds
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.metrics });
      } catch (error) {
        console.error('Error notifying metrics subscriber:', error);
      }
    });
  }

  subscribeToMetrics(callback: (metrics: ProcessingMetrics) => void): () => void {
    this.subscribers.push(callback);
    
    // Immediately send current metrics
    callback({ ...this.metrics });
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  getQueueSize(): number {
    return this.processingQueue.length;
  }

  clearQueue(): void {
    this.processingQueue = [];
    this.updateMetrics();
  }

  pause(): void {
    this.isProcessing = true; // This will prevent new processing
  }

  resume(): void {
    this.isProcessing = false;
  }
}

export const realTimeDataProcessor = RealTimeDataProcessor.getInstance();
