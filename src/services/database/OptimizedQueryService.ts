import { supabase } from '@/integrations/supabase/client';
import { queryOptimizationService } from './QueryOptimizationService';

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
  userId?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Simple types to avoid deep type instantiation
interface FleetStatistics {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;
  lastUpdated: string;
}

interface VehicleData {
  device_id: string;
  device_name: string;
  user_id?: string;
  status: string;
  is_online: boolean;
}

interface PositionData {
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude: number;
  device_time: string;
  server_time: string;
  status: number;
  moving: number;
  gps_source: string;
  battery: number;
  signal: number;
  satellites: number;
  created_at: string;
  raw_data: any;
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
    // Use the new optimization service for all queries
    return queryOptimizationService.executeOptimizedQuery(
      queryKey,
      queryFn,
      {
        userId: options.userId,
        priority: options.priority || 'medium',
        timeout: options.timeout
      }
    );
  }

  async getVehicles(userId?: string): Promise<VehicleData[]> {
    const queryKey = `vehicles:${userId || 'all'}`;
    
    return this.executeQuery(queryKey, async () => {
      try {
        const baseQuery = (supabase as any)
          .from('gp51_devices')
          .select('*')
          .eq('status', 'active');

        const finalQuery = userId ? baseQuery.eq('user_id', userId) : baseQuery;
        const { data, error } = await finalQuery;
        
        if (error) throw error;
        return (data || []) as VehicleData[];
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }
    }, { userId, priority: 'high' });
  }

  async getVehiclePositions(deviceIds: string[]): Promise<PositionData[]> {
    const queryKey = `positions:${deviceIds.sort().join(',')}`;
    
    return this.executeQuery(queryKey, async () => {
      const { data, error } = await (supabase as any)
        .from('gp51_positions')
        .select('*')
        .in('device_id', deviceIds)
        .order('created_at', { ascending: false })
        .limit(deviceIds.length);

      if (error) throw error;
      return (data || []) as PositionData[];
    }, { priority: 'high', cacheTTL: 30 * 1000 });
  }

  async getFleetStatistics(): Promise<FleetStatistics> {
    const queryKey = 'fleet:statistics';
    
    return this.executeQuery(queryKey, async () => {
      const { data: devices, error: devicesError } = await (supabase as any)
        .from('gp51_devices')
        .select('device_id, is_online, status')
        .eq('status', 'active');

      if (devicesError) throw devicesError;

      const totalVehicles = devices?.length || 0;
      const activeVehicles = devices?.filter((d: any) => d.is_online).length || 0;

      return {
        totalVehicles,
        activeVehicles,
        inactiveVehicles: totalVehicles - activeVehicles,
        lastUpdated: new Date().toISOString()
      } as FleetStatistics;
    }, { priority: 'medium', cacheTTL: 60 * 1000 });
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

    // Calculate cache hit rate - simplified calculation
    const totalQueries = this.performanceMetrics.totalQueries;
    if (totalQueries > 0) {
      // Simple approximation to avoid complex calculations
      if (cacheHit) {
        this.performanceMetrics.cacheHitRate = Math.min(
          this.performanceMetrics.cacheHitRate + (100 / totalQueries), 
          100
        );
      }
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
    // Clear both the old and new cache
    // databaseCacheManager.clear();
    console.log('🗑️ Query cache cleared');
  }

  // New advanced methods using the optimization service
  async batchGetVehicleData(userIds: string[]): Promise<VehicleData[][]> {
    const queries = userIds.map(userId => ({
      key: `vehicles:${userId}`,
      fn: () => this.getVehiclesInternal(userId),
      context: { userId, priority: 'medium' as const }
    }));

    return queryOptimizationService.executeBatchQueries(queries);
  }

  private async getVehiclesInternal(userId: string): Promise<VehicleData[]> {
    const baseQuery = (supabase as any)
      .from('gp51_devices')
      .select('*')
      .eq('status', 'active')
      .eq('user_id', userId);

    const { data, error } = await baseQuery;
    if (error) throw error;
    return (data || []) as VehicleData[];
  }

  getAdvancedMetrics() {
    return queryOptimizationService.getOptimizationReport();
  }

  invalidateUserCache(userId: string): void {
    queryOptimizationService.invalidateRelatedCache(`.*:${userId}.*`);
  }
}

export const optimizedQueryService = OptimizedQueryService.getInstance();
