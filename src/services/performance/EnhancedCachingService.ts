interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  evictions: number;
  averageAccessTime: number;
}

interface CacheConfig {
  defaultTtl: number;
  maxSize: number;
  cleanupInterval: number;
  enableAnalytics: boolean;
}

export class EnhancedCachingService {
  private static instance: EnhancedCachingService;
  private memoryCache = new Map<string, CacheEntry<any>>();
  private browserCache: Cache | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalSize: 0,
    evictions: 0,
    averageAccessTime: 0
  };
  private accessTimes: number[] = [];
  
  private config: CacheConfig = {
    defaultTtl: 300000, // 5 minutes
    maxSize: 100, // 100 entries
    cleanupInterval: 60000, // 1 minute
    enableAnalytics: true
  };

  static getInstance(): EnhancedCachingService {
    if (!EnhancedCachingService.instance) {
      EnhancedCachingService.instance = new EnhancedCachingService();
    }
    return EnhancedCachingService.instance;
  }

  constructor() {
    this.initializeBrowserCache();
    this.startCleanupTask();
  }

  private async initializeBrowserCache(): Promise<void> {
    if ('caches' in window) {
      try {
        this.browserCache = await caches.open('envio-cache-v1');
        console.log('Browser cache initialized');
      } catch (error) {
        console.warn('Failed to initialize browser cache:', error);
      }
    }
  }

  private startCleanupTask(): void {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  public async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    // Try memory cache first
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      this.recordAccess(startTime, true);
      return memoryResult;
    }

    // Try browser cache
    if (this.browserCache) {
      const browserResult = await this.getFromBrowserCache<T>(key);
      if (browserResult !== null) {
        // Warm memory cache
        this.setInMemory(key, browserResult, this.config.defaultTtl, []);
        this.recordAccess(startTime, true);
        return browserResult;
      }
    }

    this.recordAccess(startTime, false);
    return null;
  }

  public async set<T>(
    key: string, 
    data: T, 
    ttl: number = this.config.defaultTtl,
    tags: string[] = []
  ): Promise<void> {
    // Set in memory cache
    this.setInMemory(key, data, ttl, tags);
    
    // Set in browser cache if available
    if (this.browserCache) {
      await this.setInBrowserCache(key, data, ttl);
    }

    console.debug(`Cached item with key: ${key}, TTL: ${ttl}ms`);
  }

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  private setInMemory<T>(key: string, data: T, ttl: number, tags: string[]): void {
    // Evict if at max size
    if (this.memoryCache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags
    };

    this.memoryCache.set(key, entry);
    this.updateStats();
  }

  private async getFromBrowserCache<T>(key: string): Promise<T | null> {
    if (!this.browserCache) return null;

    try {
      const response = await this.browserCache.match(key);
      if (response) {
        const data = await response.json();
        
        // Check expiration
        if (data.expires && Date.now() > data.expires) {
          await this.browserCache.delete(key);
          return null;
        }
        
        return data.value;
      }
    } catch (error) {
      console.warn('Error reading from browser cache:', error);
    }

    return null;
  }

  private async setInBrowserCache<T>(key: string, data: T, ttl: number): Promise<void> {
    if (!this.browserCache) return;

    try {
      const cacheData = {
        value: data,
        expires: Date.now() + ttl
      };

      const response = new Response(JSON.stringify(cacheData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${Math.floor(ttl / 1000)}`
        }
      });

      await this.browserCache.put(key, response);
    } catch (error) {
      console.warn('Error writing to browser cache:', error);
    }
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.stats.evictions++;
      console.debug(`Evicted cache entry: ${oldestKey}`);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryCache) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.memoryCache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.debug(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }

    this.updateStats();
  }

  public async invalidateByTag(tag: string): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    console.debug(`Invalidated ${keysToDelete.length} cache entries with tag: ${tag}`);
  }

  public async invalidateByPattern(pattern: RegExp): Promise<void> {
    const keysToDelete: string[] = [];

    for (const key of this.memoryCache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
    
    console.debug(`Invalidated ${keysToDelete.length} cache entries matching pattern`);
  }

  public async warmCache(key: string, dataFetcher: () => Promise<any>, ttl?: number): Promise<void> {
    try {
      const data = await dataFetcher();
      await this.set(key, data, ttl);
      console.debug(`Warmed cache for key: ${key}`);
    } catch (error) {
      console.error(`Failed to warm cache for key ${key}:`, error);
    }
  }

  private recordAccess(startTime: number, hit: boolean): void {
    const accessTime = performance.now() - startTime;
    this.accessTimes.push(accessTime);
    
    // Keep only recent access times
    if (this.accessTimes.length > 100) {
      this.accessTimes = this.accessTimes.slice(-100);
    }

    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    this.updateStats();
  }

  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    this.stats.totalSize = this.memoryCache.size;
    this.stats.averageAccessTime = this.accessTimes.length > 0
      ? this.accessTimes.reduce((sum, time) => sum + time, 0) / this.accessTimes.length
      : 0;
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public getCacheEntries(): Array<{ key: string; size: number; accessCount: number; age: number }> {
    const entries: Array<{ key: string; size: number; accessCount: number; age: number }> = [];
    
    for (const [key, entry] of this.memoryCache) {
      entries.push({
        key,
        size: JSON.stringify(entry.data).length,
        accessCount: entry.accessCount,
        age: Date.now() - entry.timestamp
      });
    }

    return entries.sort((a, b) => b.accessCount - a.accessCount);
  }

  public clear(): void {
    this.memoryCache.clear();
    if (this.browserCache) {
      this.browserCache.keys().then(keys => {
        keys.forEach(key => this.browserCache?.delete(key));
      });
    }
    
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSize: 0,
      evictions: 0,
      averageAccessTime: 0
    };
    
    console.log('Cache cleared');
  }
}

export const enhancedCachingService = EnhancedCachingService.getInstance();
