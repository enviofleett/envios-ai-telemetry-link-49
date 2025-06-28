
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  cacheSize: number;
  memoryUsage: number;
}

export class DatabaseCacheManager {
  private static instance: DatabaseCacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };
  private maxCacheSize = 1000; // Maximum number of cache entries
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  static getInstance(): DatabaseCacheManager {
    if (!DatabaseCacheManager.instance) {
      DatabaseCacheManager.instance = new DatabaseCacheManager();
    }
    return DatabaseCacheManager.instance;
  }

  private constructor() {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
    
    // Log cache stats every 5 minutes in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => this.logStats(), 5 * 60 * 1000);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    };

    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  // Bulk operations for better performance
  async getBulk<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  async setBulk<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  getStats(): CacheStats {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
    const missRate = this.stats.totalRequests > 0 
      ? (this.stats.misses / this.stats.totalRequests) * 100 
      : 0;

    return {
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      totalRequests: this.stats.totalRequests,
      cacheSize: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache) {
      size += key.length * 2; // String characters are 2 bytes each
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Approximate overhead for the entry object
    }
    return Math.round(size / 1024); // Return KB
  }

  private logStats(): void {
    const stats = this.getStats();
    console.log('📊 Cache Statistics:', {
      'Hit Rate': `${stats.hitRate}%`,
      'Miss Rate': `${stats.missRate}%`,
      'Total Requests': stats.totalRequests,
      'Cache Size': stats.cacheSize,
      'Memory Usage': `${stats.memoryUsage} KB`
    });
  }

  // Cache warming methods
  async warmCache(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    console.log(`🔥 Warming cache with ${keys.length} keys...`);
    
    const promises = keys.map(async (key) => {
      try {
        const data = await fetcher(key);
        await this.set(key, data);
      } catch (error) {
        console.error(`Failed to warm cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('✅ Cache warming completed');
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, totalRequests: 0 };
  }
}

export const databaseCacheManager = DatabaseCacheManager.getInstance();
