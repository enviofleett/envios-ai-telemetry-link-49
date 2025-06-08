
import { enhancedCachingService } from './EnhancedCachingService';
import { performanceMonitoringService } from './PerformanceMonitoringService';

export class CacheIntegrationService {
  private static instance: CacheIntegrationService;

  static getInstance(): CacheIntegrationService {
    if (!CacheIntegrationService.instance) {
      CacheIntegrationService.instance = new CacheIntegrationService();
    }
    return CacheIntegrationService.instance;
  }

  // Vehicle Data Caching
  async cacheVehicleData(vehicleId: string, data: any, tags: string[] = []): Promise<void> {
    const cacheKey = `vehicle:${vehicleId}`;
    const ttl = 300000; // 5 minutes for vehicle position data
    
    await enhancedCachingService.set(cacheKey, data, ttl, [...tags, 'vehicle', 'position']);
    console.debug(`Cached vehicle data for ${vehicleId}`);
  }

  async getCachedVehicleData(vehicleId: string): Promise<any> {
    const cacheKey = `vehicle:${vehicleId}`;
    const startTime = performance.now();
    
    const data = await enhancedCachingService.get(cacheKey);
    
    // Track cache performance
    const accessTime = performance.now() - startTime;
    if (accessTime > 50) {
      console.warn(`Slow cache access for vehicle ${vehicleId}: ${accessTime}ms`);
    }
    
    return data;
  }

  // GP51 API Response Caching
  async cacheGP51Response(endpoint: string, params: Record<string, any>, data: any): Promise<void> {
    const cacheKey = `gp51:${endpoint}:${JSON.stringify(params)}`;
    const ttl = this.getGP51CacheTTL(endpoint);
    
    await enhancedCachingService.set(cacheKey, data, ttl, ['gp51', endpoint]);
    console.debug(`Cached GP51 response for ${endpoint}`);
  }

  async getCachedGP51Response(endpoint: string, params: Record<string, any>): Promise<any> {
    const cacheKey = `gp51:${endpoint}:${JSON.stringify(params)}`;
    return await enhancedCachingService.get(cacheKey);
  }

  private getGP51CacheTTL(endpoint: string): number {
    const ttlMap: Record<string, number> = {
      'authenticate': 3600000, // 1 hour
      'get_devices': 1800000,  // 30 minutes
      'get_positions': 30000,  // 30 seconds
      'get_users': 1800000,    // 30 minutes
      'get_groups': 3600000,   // 1 hour
      'get_geofences': 1800000 // 30 minutes
    };
    
    return ttlMap[endpoint] || 300000; // Default 5 minutes
  }

  // User Session Caching
  async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    const cacheKey = `session:${userId}`;
    const ttl = 1800000; // 30 minutes
    
    await enhancedCachingService.set(cacheKey, sessionData, ttl, ['session', 'user']);
  }

  async getCachedUserSession(userId: string): Promise<any> {
    const cacheKey = `session:${userId}`;
    return await enhancedCachingService.get(cacheKey);
  }

  // Dashboard Data Caching
  async cacheDashboardData(userId: string, dashboardType: string, data: any): Promise<void> {
    const cacheKey = `dashboard:${userId}:${dashboardType}`;
    const ttl = 120000; // 2 minutes
    
    await enhancedCachingService.set(cacheKey, data, ttl, ['dashboard', dashboardType]);
  }

  async getCachedDashboardData(userId: string, dashboardType: string): Promise<any> {
    const cacheKey = `dashboard:${userId}:${dashboardType}`;
    return await enhancedCachingService.get(cacheKey);
  }

  // Cache Warming Strategies
  async warmVehicleCache(vehicleIds: string[]): Promise<void> {
    console.log(`Warming cache for ${vehicleIds.length} vehicles`);
    
    const warmingPromises = vehicleIds.map(async (vehicleId) => {
      try {
        // Simulate fetching vehicle data (in real implementation, fetch from database)
        const vehicleData = {
          id: vehicleId,
          lastPosition: null,
          status: 'unknown',
          lastUpdate: new Date()
        };
        
        await this.cacheVehicleData(vehicleId, vehicleData, ['warmed']);
      } catch (error) {
        console.warn(`Failed to warm cache for vehicle ${vehicleId}:`, error);
      }
    });
    
    await Promise.allSettled(warmingPromises);
    console.log('Vehicle cache warming completed');
  }

  async warmGP51Cache(): Promise<void> {
    console.log('Warming GP51 API cache with common requests');
    
    const commonEndpoints = [
      { endpoint: 'get_devices', params: {} },
      { endpoint: 'get_users', params: {} },
      { endpoint: 'get_groups', params: {} }
    ];
    
    const warmingPromises = commonEndpoints.map(async ({ endpoint, params }) => {
      try {
        // In real implementation, make actual GP51 API calls
        const mockData = { endpoint, params, timestamp: Date.now() };
        await this.cacheGP51Response(endpoint, params, mockData);
      } catch (error) {
        console.warn(`Failed to warm GP51 cache for ${endpoint}:`, error);
      }
    });
    
    await Promise.allSettled(warmingPromises);
    console.log('GP51 cache warming completed');
  }

  // Cache Invalidation Strategies
  async invalidateVehicleCache(vehicleId?: string): Promise<void> {
    if (vehicleId) {
      const cacheKey = `vehicle:${vehicleId}`;
      await enhancedCachingService.invalidateByPattern(new RegExp(`^${cacheKey}`));
      console.debug(`Invalidated cache for vehicle ${vehicleId}`);
    } else {
      await enhancedCachingService.invalidateByTag('vehicle');
      console.debug('Invalidated all vehicle cache entries');
    }
  }

  async invalidateGP51Cache(endpoint?: string): Promise<void> {
    if (endpoint) {
      await enhancedCachingService.invalidateByPattern(new RegExp(`^gp51:${endpoint}:`));
      console.debug(`Invalidated GP51 cache for endpoint ${endpoint}`);
    } else {
      await enhancedCachingService.invalidateByTag('gp51');
      console.debug('Invalidated all GP51 cache entries');
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await enhancedCachingService.invalidateByPattern(new RegExp(`^(session|dashboard):${userId}`));
    console.debug(`Invalidated cache for user ${userId}`);
  }

  // Performance Monitoring Integration
  async measureCachePerformance(): Promise<{
    hitRate: number;
    averageAccessTime: number;
    totalSize: number;
    recommendations: string[];
  }> {
    const stats = enhancedCachingService.getStats();
    const entries = enhancedCachingService.getCacheEntries();
    
    const recommendations: string[] = [];
    
    if (stats.hitRate < 70) {
      recommendations.push('Cache hit rate is below 70% - consider increasing TTL values');
    }
    
    if (stats.averageAccessTime > 10) {
      recommendations.push('Cache access time is high - consider cache size optimization');
    }
    
    if (stats.totalSize > 80) {
      recommendations.push('Cache is near capacity - consider increasing max size or implementing better eviction');
    }
    
    const topAccessedEntries = entries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5);
      
    if (topAccessedEntries.length > 0) {
      recommendations.push(`Most accessed: ${topAccessedEntries.map(e => e.key).join(', ')}`);
    }
    
    return {
      hitRate: stats.hitRate,
      averageAccessTime: stats.averageAccessTime,
      totalSize: stats.totalSize,
      recommendations
    };
  }

  // Automated Cache Management
  startAutomatedCacheManagement(): void {
    // Warm cache every 5 minutes
    setInterval(() => {
      this.warmGP51Cache();
    }, 300000);
    
    // Performance monitoring every minute
    setInterval(async () => {
      const performance = await this.measureCachePerformance();
      
      if (performance.hitRate < 50) {
        console.warn('Cache performance degraded:', performance);
        
        // Auto-adjust cache warming frequency
        this.warmGP51Cache();
      }
    }, 60000);
    
    // Cleanup and optimization every hour
    setInterval(() => {
      console.log('Running automated cache optimization');
      // Cache optimization logic would go here
    }, 3600000);
    
    console.log('Automated cache management started');
  }
}

export const cacheIntegrationService = CacheIntegrationService.getInstance();
