
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
  totalHits: number;
  totalMisses: number;
  totalSize: number;
  entries: number;
}

export class EnhancedCachingService {
  private static instance: EnhancedCachingService;
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0
  };
  private maxSize = 1000;
  private cleanupInterval: number | null = null;

  static getInstance(): EnhancedCachingService {
    if (!EnhancedCachingService.instance) {
      EnhancedCachingService.instance = new EnhancedCachingService();
    }
    return EnhancedCachingService.instance;
  }

  constructor() {
    this.startCleanupTimer();
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
    this.evictIfNecessary();
  }

  get<T>(key: string): T | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.totalMisses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.totalMisses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.totalHits++;

    return entry.data as T;
  }

  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let deleted = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0
    };
  }

  getStats(): CacheStats {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.totalHits / this.stats.totalRequests) * 100 
      : 0;
    
    const missRate = 100 - hitRate;
    
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += JSON.stringify(entry.data).length;
    });

    return {
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      totalRequests: this.stats.totalRequests,
      totalHits: this.stats.totalHits,
      totalMisses: this.stats.totalMisses,
      totalSize,
      entries: this.cache.size
    };
  }

  // Cache with automatic fetch and update
  async getOrFetch<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttlSeconds);
    return data;
  }

  private evictIfNecessary(): void {
    if (this.cache.size <= this.maxSize) return;

    // LRU eviction: remove least recently used items
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = Math.floor(this.maxSize * 0.1); // Remove 10%
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.debug(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

export const enhancedCachingService = EnhancedCachingService.getInstance();
