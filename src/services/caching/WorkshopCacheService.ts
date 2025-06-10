
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfiguration {
  ttlSeconds: number;
  maxSizeMb: number;
  compressionEnabled: boolean;
  autoRefresh: boolean;
}

export class WorkshopCacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private configurations: Map<string, CacheConfiguration> = new Map();

  constructor() {
    // Set default configurations
    this.configurations.set('workshop_data', {
      ttlSeconds: 300, // 5 minutes
      maxSizeMb: 10,
      compressionEnabled: true,
      autoRefresh: false
    });

    this.configurations.set('user_permissions', {
      ttlSeconds: 600, // 10 minutes
      maxSizeMb: 5,
      compressionEnabled: false,
      autoRefresh: true
    });

    this.configurations.set('form_templates', {
      ttlSeconds: 1800, // 30 minutes
      maxSizeMb: 20,
      compressionEnabled: true,
      autoRefresh: false
    });

    // Clean up expired cache every minute
    setInterval(() => this.cleanupExpired(), 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) return null;

    const now = Date.now();
    const config = this.configurations.get(this.getCacheType(key));
    
    if (config && now - item.timestamp > config.ttlSeconds * 1000) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  async set<T>(key: string, data: T, customTtl?: number): Promise<void> {
    const config = this.configurations.get(this.getCacheType(key));
    const ttl = customTtl || (config?.ttlSeconds ?? 300);

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000
    };

    this.cache.set(key, item);

    // Check cache size and cleanup if necessary
    this.ensureCacheSize();
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Optimistic updates for better UX
  async optimisticUpdate<T>(
    key: string, 
    updateFn: (current: T | null) => T,
    asyncUpdateFn: () => Promise<T>
  ): Promise<T> {
    // Apply optimistic update immediately
    const current = await this.get<T>(key);
    const optimisticData = updateFn(current);
    await this.set(key, optimisticData);

    try {
      // Perform actual update in background
      const realData = await asyncUpdateFn();
      await this.set(key, realData);
      return realData;
    } catch (error) {
      // Revert optimistic update on error
      if (current !== null) {
        await this.set(key, current);
      } else {
        await this.invalidate(key);
      }
      throw error;
    }
  }

  // Background sync for offline scenarios
  async syncWithServer<T>(
    key: string,
    fetchFn: () => Promise<T>,
    conflictResolver?: (local: T, server: T) => T
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    try {
      const serverData = await fetchFn();
      
      if (cached && conflictResolver) {
        const resolved = conflictResolver(cached, serverData);
        await this.set(key, resolved);
        return resolved;
      } else {
        await this.set(key, serverData);
        return serverData;
      }
    } catch (error) {
      // Return cached data if server is unavailable
      if (cached) {
        console.warn('Server unavailable, using cached data:', error);
        return cached;
      }
      throw error;
    }
  }

  private getCacheType(key: string): string {
    if (key.includes('workshop_')) return 'workshop_data';
    if (key.includes('permission_')) return 'user_permissions';
    if (key.includes('template_')) return 'form_templates';
    return 'workshop_data'; // default
  }

  private cleanupExpired(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private ensureCacheSize(): void {
    // Simple cache size management
    if (this.cache.size > 1000) {
      // Remove oldest 100 entries
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, 100);
      
      entries.forEach(([key]) => this.cache.delete(key));
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      configurations: Array.from(this.configurations.entries())
    };
  }
}

export const workshopCacheService = new WorkshopCacheService();
