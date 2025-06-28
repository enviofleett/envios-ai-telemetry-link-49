import { supabase } from '@/integrations/supabase/client';
import { databaseCacheManager } from '../caching/DatabaseCacheManager';

interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  forceRefresh?: boolean;
  timeout?: number;
}

interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  cacheHit: boolean;
  resultCount: number;
  timestamp: Date;
}

export class OptimizedQueryService {
  private static instance: OptimizedQueryService;
  private queryMetrics: QueryPerformanceMetrics[] = [];
  private activeQueries = new Map<string, Promise<any>>();

  static getInstance(): OptimizedQueryService {
    if (!OptimizedQueryService.instance) {
      OptimizedQueryService.instance = new OptimizedQueryService();
    }
    return OptimizedQueryService.instance;
  }

  // Optimized vehicle positions query with caching
  async getVehiclePositions(
    deviceIds?: string[],
    options: QueryOptions = {}
  ): Promise<any[]> {
    const cacheKey = `positions:${deviceIds?.join(',') || 'all'}`;
    const startTime = Date.now();

    if (options.useCache !== false && !options.forceRefresh) {
      const cached = await databaseCacheManager.get<any[]>(cacheKey);
      if (cached) {
        this.recordMetric({
          query: 'getVehiclePositions',
          executionTime: Date.now() - startTime,
          cacheHit: true,
          resultCount: cached.length,
          timestamp: new Date()
        });
        return cached;
      }
    }

    let query = supabase
      .from('gp51_positions')
      .select(`
        device_id,
        latitude,
        longitude,
        speed,
        course,
        altitude,
        device_time,
        server_time,
        status,
        moving,
        gps_source,
        battery,
        signal,
        satellites,
        created_at,
        raw_data
      `)
      .order('created_at', { ascending: false });

    if (deviceIds && deviceIds.length > 0) {
      query = query.in('device_id', deviceIds);
    }

    const { data, error } = await query.limit(1000);

    if (error) throw error;

    const result = data || [];
    
    // Cache the result
    if (options.useCache !== false) {
      await databaseCacheManager.set(
        cacheKey, 
        result, 
        options.cacheTTL || 2 * 60 * 1000 // 2 minutes default
      );
    }

    this.recordMetric({
      query: 'getVehiclePositions',
      executionTime: Date.now() - startTime,
      cacheHit: false,
      resultCount: result.length,
      timestamp: new Date()
    });

    return result;
  }

  // Optimized device list query
  async getDeviceList(options: QueryOptions = {}): Promise<any[]> {
    const cacheKey = 'devices:list';
    const startTime = Date.now();

    if (options.useCache !== false && !options.forceRefresh) {
      const cached = await databaseCacheManager.get<any[]>(cacheKey);
      if (cached) {
        this.recordMetric({
          query: 'getDeviceList',
          executionTime: Date.now() - startTime,
          cacheHit: true,
          resultCount: cached.length,
          timestamp: new Date()
        });
        return cached;
      }
    }

    const { data, error } = await supabase
      .from('gp51_devices')
      .select(`
        device_id,
        device_name,
        device_type,
        group_id,
        group_name,
        is_free,
        last_active_time,
        status,
        user_id,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('device_name', { ascending: true });

    if (error) throw error;

    const result = data || [];
    
    // Cache for 10 minutes
    if (options.useCache !== false) {
      await databaseCacheManager.set(
        cacheKey, 
        result, 
        options.cacheTTL || 10 * 60 * 1000
      );
    }

    this.recordMetric({
      query: 'getDeviceList',
      executionTime: Date.now() - startTime,
      cacheHit: false,
      resultCount: result.length,
      timestamp: new Date()
    });

    return result;
  }

  // Batch position updates for better performance
  async batchUpdatePositions(positions: any[]): Promise<void> {
    const startTime = Date.now();

    if (positions.length === 0) return;

    // Group positions by device for efficient processing
    const deviceGroups = new Map<string, any[]>();
    positions.forEach(pos => {
      const deviceId = pos.device_id;
      if (!deviceGroups.has(deviceId)) {
        deviceGroups.set(deviceId, []);
      }
      deviceGroups.get(deviceId)?.push(pos);
    });

    // Process in smaller batches to avoid timeout
    const batchSize = 50;
    const batches = Array.from(deviceGroups.values()).reduce((acc, positions) => {
      for (let i = 0; i < positions.length; i += batchSize) {
        acc.push(positions.slice(i, i + batchSize));
      }
      return acc;
    }, [] as any[][]);

    const promises = batches.map(batch => 
      supabase
        .from('gp51_positions')
        .upsert(batch, { onConflict: 'device_id,device_time' })
    );

    const results = await Promise.allSettled(promises);
    
    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Batch ${index} failed:`, result.reason);
      }
    });

    // Invalidate related cache entries
    await databaseCacheManager.invalidatePattern('positions:');

    this.recordMetric({
      query: 'batchUpdatePositions',
      executionTime: Date.now() - startTime,
      cacheHit: false,
      resultCount: positions.length,
      timestamp: new Date()
    });
  }

  // Query deduplication to prevent multiple identical queries
  async executeWithDeduplication<T>(
    queryKey: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    // Check if query is already running
    if (this.activeQueries.has(queryKey)) {
      return this.activeQueries.get(queryKey) as Promise<T>;
    }

    // Execute query and store promise
    const queryPromise = queryFn().finally(() => {
      this.activeQueries.delete(queryKey);
    });

    this.activeQueries.set(queryKey, queryPromise);
    return queryPromise;
  }

  // Performance analytics
  private recordMetric(metric: QueryPerformanceMetrics): void {
    this.queryMetrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  getPerformanceMetrics(): {
    averageExecutionTime: number;
    cacheHitRate: number;
    slowQueries: QueryPerformanceMetrics[];
    totalQueries: number;
  } {
    if (this.queryMetrics.length === 0) {
      return {
        averageExecutionTime: 0,
        cacheHitRate: 0,
        slowQueries: [],
        totalQueries: 0
      };
    }

    const totalTime = this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0);
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    const slowQueries = this.queryMetrics
      .filter(m => m.executionTime > 1000) // > 1 second
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      averageExecutionTime: Math.round(totalTime / this.queryMetrics.length),
      cacheHitRate: Math.round((cacheHits / this.queryMetrics.length) * 100),
      slowQueries,
      totalQueries: this.queryMetrics.length
    };
  }

  // Preload commonly accessed data
  async warmupCache(): Promise<void> {
    console.log('🔥 Starting database cache warmup...');
    
    try {
      // Warmup device list
      await this.getDeviceList({ useCache: false });
      
      // Warmup recent positions
      await this.getVehiclePositions(undefined, { useCache: false });
      
      console.log('✅ Database cache warmup completed');
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
    }
  }
}

export const optimizedQueryService = OptimizedQueryService.getInstance();
