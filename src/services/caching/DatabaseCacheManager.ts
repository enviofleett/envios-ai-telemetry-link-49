interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  averageAccessTime: number;
  memoryUsage: number;
}

export class DatabaseCacheManager {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000;
  private hitCount = 0;
  private missCount = 0;
  private accessTimes: number[] = [];

  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      this.recordAccessTime(performance.now() - startTime);
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      this.recordAccessTime(performance.now() - startTime);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hitCount++;
    this.recordAccessTime(performance.now() - startTime);

    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);
    // Keep only recent access times for average calculation
    if (this.accessTimes.length > 100) {
      this.accessTimes = this.accessTimes.slice(-50);
    }
  }

  getStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount;
    
    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.missCount / totalRequests) * 100 : 0,
      averageAccessTime: this.accessTimes.length > 0 
        ? this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length 
        : 0,
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry).length;
    }
    return totalSize;
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.accessTimes = [];
  }

  invalidate(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

export const databaseCacheManager = new DatabaseCacheManager();
