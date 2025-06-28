
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

  async executeQuery(
    queryKey: string,
    queryFn: () => Promise<any>,
    options: QueryOptions = {}
  ): Promise<any> {
    const startTime = Date.now();
    const { useCache = true, cacheTTL = 5 * 60 * 1000 } = options;

    try {
      // Try cache first if enabled
      if (useCache) {
        const cached = await databaseCacheManager.get(queryKey);
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

  async getVehicles(userId?: string) {
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

  async getVehiclePositions(deviceIds: string[]) {
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
      const currentTotal = this.performanceMetrics.totalQueries;
      const previousAvg = this.performanceMetrics.averageExecutionTime;
      
      // Simple running average calculation
      if (currentTotal === 1) {
        this.performanceMetrics.averageExecutionTime = executionTime;
      } else {
        this.performanceMetrics.averageExecutionTime = 
          ((previousAvg * (currentTotal - 1)) + executionTime) / currentTotal;
      }

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

    // Calculate cache hit rate
    const totalQueries = this.performanceMetrics.totalQueries;
    if (totalQueries > 0) {
      const currentHitCount = Math.floor(this.performanceMetrics.cacheHitRate * (totalQueries - 1) / 100);
      const newHitCount = cacheHit ? currentHitCount + 1 : currentHitCount;
      this.performanceMetrics.cacheHitRate = (newHitCount / totalQueries) * 100;
    }
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
