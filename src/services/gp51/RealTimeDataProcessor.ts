
interface ProcessingMetrics {
  processedCount: number;
  throughputPerMinute: number;
  errorCount: number;
  lastProcessedAt: Date | null;
  averageProcessingTime: number;
}

interface QueuedPosition {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude: number;
  timestamp: Date;
  status: string;
}

export class RealTimeDataProcessor {
  private static instance: RealTimeDataProcessor;
  private isProcessing = false;
  private queue: QueuedPosition[] = [];
  private metrics: ProcessingMetrics = {
    processedCount: 0,
    throughputPerMinute: 0,
    errorCount: 0,
    lastProcessedAt: null,
    averageProcessingTime: 0
  };
  private processingInterval: NodeJS.Timeout | null = null;

  static getInstance(): RealTimeDataProcessor {
    if (!RealTimeDataProcessor.instance) {
      RealTimeDataProcessor.instance = new RealTimeDataProcessor();
    }
    return RealTimeDataProcessor.instance;
  }

  startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('🚀 Starting real-time data processing...');
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 5000); // Process every 5 seconds
  }

  stopProcessing(): void {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('⏹️ Stopped real-time data processing');
  }

  addToQueue(position: QueuedPosition): void {
    this.queue.push(position);
    console.log(`📥 Added position to queue. Queue size: ${this.queue.length}`);
  }

  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const startTime = Date.now();
    const batchSize = Math.min(this.queue.length, 50);
    const batch = this.queue.splice(0, batchSize);

    try {
      console.log(`🔄 Processing batch of ${batch.length} positions...`);
      
      // Transform positions for database insertion
      const dbPositions = batch.map(pos => ({
        device_id: pos.deviceId,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed,
        course: pos.course,
        altitude: pos.altitude,
        position_data: JSON.stringify({
          timestamp: pos.timestamp.toISOString(),
          status: pos.status
        }),
        position_timestamp: pos.timestamp.toISOString(),
        server_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }));

      // Insert positions into database
      const { error } = await supabase
        .from('gp51_positions')
        .insert(dbPositions);

      if (error) {
        console.error('❌ Database insertion error:', error);
        this.metrics.errorCount += batch.length;
      } else {
        console.log(`✅ Successfully processed ${batch.length} positions`);
        this.metrics.processedCount += batch.length;
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.metrics.lastProcessedAt = new Date();
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime + processingTime) / 2;
      
      // Calculate throughput (positions per minute)
      this.metrics.throughputPerMinute = Math.round(
        (this.metrics.processedCount / ((Date.now() - startTime) / 60000)) || 0
      );

    } catch (error) {
      console.error('❌ Error processing queue:', error);
      this.metrics.errorCount += batch.length;
    }
  }

  // Simulate adding GPS data
  simulateGPSData(deviceId: string): void {
    const position: QueuedPosition = {
      deviceId,
      latitude: -1.286389 + (Math.random() - 0.5) * 0.01,
      longitude: 36.817223 + (Math.random() - 0.5) * 0.01,
      speed: Math.random() * 80,
      course: Math.random() * 360,
      altitude: 1600 + Math.random() * 100,
      timestamp: new Date(),
      status: 'moving'
    };

    this.addToQueue(position);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
    console.log('🗑️ Queue cleared');
  }
}

// Import supabase at the top level
import { supabase } from '@/integrations/supabase/client';

export const realTimeDataProcessor = RealTimeDataProcessor.getInstance();
