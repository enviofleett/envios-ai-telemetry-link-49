import { supabase } from '@/integrations/supabase/client';
import { databaseCacheManager } from '@/services/caching/DatabaseCacheManager';

interface QueryPerformanceMetrics {
  averageExecutionTime: number;
  cacheHitRate: number;
  slowQueries: Array<{
    query: string;
    executionTime: number;
    timestamp: Date;
  }>;
  totalQueries: number;
}

interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  timeout?: number;
}

export class OptimizedQueryService {
  private static instance: OptimizedQueryService;
  private performanceMetrics: QueryPerformanceMetrics = {
    averageExecutionTime: 0,
    cacheHitRate: 0,
    slowQueries: [],
    totalQueries: 0
  };

  static getInstance(): OptimizedQueryService {
    if (!OptimizedQueryService.instance) {
      OptimizedQueryService.instance = new OptimizedQueryService();
    }
    return OptimizedQueryService.instance;
  }

  async executeQuery<T = unknown>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const { useCache = true, cacheTTL = 5 * 60 * 1000 } = options;

    try {
      // Try cache first if enabled
      if (useCache) {
        const cached = await databaseCacheManager.get<T>(queryKey);
        if (cached !== null) {
          this.updateMetrics(Date.now() - startTime, true);
          return cached;
        }
      }

      // Execute query
      const result = await queryFn();

      // Cache result if enabled
      if (useCache && result) {
        await databaseCacheManager.set(queryKey, result, cacheTTL);
      }

      this.updateMetrics(Date.now() - startTime, false);
      return result;
    } catch (error) {
      this.updateMetrics(Date.now() - startTime, false, true);
      throw error;
    }
  }

  async getVehicles(userId?: string): Promise<any[]> {
    const queryKey = `vehicles:${userId || 'all'}`;
    
    return this.executeQuery(queryKey, async () => {
      let query = supabase
        .from('gp51_devices')
        .select('*')
        .eq('status', 'active');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    });
  }

  async getVehiclePositions(deviceIds: string[]): Promise<any[]> {
    const queryKey = `positions:${deviceIds.sort().join(',')}`;
    
    return this.executeQuery(queryKey, async () => {
      const { data, error } = await supabase
        .from('gp51_positions')
        .select('*')
        .in('device_id', deviceIds)
        .order('created_at', { ascending: false })
        .limit(deviceIds.length);

      if (error) throw error;
      return data || [];
    }, { cacheTTL: 30 * 1000 }); // Cache for 30 seconds
  }

  async getFleetStatistics() {
    const queryKey = 'fleet:statistics';
    
    return this.executeQuery(queryKey, async () => {
      const { data: devices, error: devicesError } = await supabase
        .from('gp51_devices')
        .select('device_id, is_online, status')
        .eq('status', 'active');

      if (devicesError) throw devicesError;

      const totalVehicles = devices?.length || 0;
      const activeVehicles = devices?.filter(d => d.is_online).length || 0;

      return {
        totalVehicles,
        activeVehicles,
        inactiveVehicles: totalVehicles - activeVehicles,
        lastUpdated: new Date().toISOString()
      };
    }, { cacheTTL: 60 * 1000 }); // Cache for 1 minute
  }

  private updateMetrics(executionTime: number, cacheHit: boolean, hasError = false): void {
    this.performanceMetrics.totalQueries++;
    
    if (!cacheHit) {
      const currentAvg = this.performanceMetrics.averageExecutionTime;
      const totalNonCachedQueries = this.performanceMetrics.totalQueries - 
        Math.floor(this.performanceMetrics.totalQueries * (this.performanceMetrics.cacheHitRate / 100));
      
      this.performanceMetrics.averageExecutionTime = 
        (currentAvg * (totalNonCachedQueries - 1) + executionTime) / totalNonCachedQueries;

      // Track slow queries (>1 second)
      if (executionTime > 1000) {
        this.performanceMetrics.slowQueries.push({
          query: 'database-query',
          executionTime,
          timestamp: new Date()
        });

        // Keep only last 10 slow queries
        if (this.performanceMetrics.slowQueries.length > 10) {
          this.performanceMetrics.slowQueries = this.performanceMetrics.slowQueries.slice(-10);
        }
      }
    }

    // Simple cache hit rate calculation to avoid type recursion
    const totalQueries = this.performanceMetrics.totalQueries;
    const currentHitRate = this.performanceMetrics.cacheHitRate;
    const currentHits = Math.floor((totalQueries - 1) * (currentHitRate / 100));
    const newHits = cacheHit ? currentHits + 1 : currentHits;
    this.performanceMetrics.cacheHitRate = totalQueries > 0 ? (newHits / totalQueries) * 100 : 0;
  }

  getPerformanceMetrics(): QueryPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  async warmupCache(): Promise<void> {
    console.log('🔥 Starting cache warmup...');
    
    try {
      // Warmup common queries
      await Promise.allSettled([
        this.getFleetStatistics(),
        this.getVehicles(),
      ]);
      
      console.log('✅ Cache warmup completed');
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
    }
  }

  clearCache(): void {
    databaseCacheManager.clear();
    console.log('🗑️ Query cache cleared');
  }
}

export const optimizedQueryService = OptimizedQueryService.getInstance();
