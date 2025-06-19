
import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
}

export class SecureCache {
  private static instance: SecureCache;
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private stats = { hits: 0, misses: 0 };

  static getInstance(): SecureCache {
    if (!SecureCache.instance) {
      SecureCache.instance = new SecureCache();
    }
    return SecureCache.instance;
  }

  private constructor() {
    // Auto-cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Ensure cache doesn't grow too large
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
      hits: 0
    };

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

export const useSecureCache = () => {
  const cache = useRef(SecureCache.getInstance());
  const [stats, setStats] = useState<CacheStats>(cache.current.getStats());

  const updateStats = useCallback(() => {
    setStats(cache.current.getStats());
  }, []);

  useEffect(() => {
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [updateStats]);

  const set = useCallback(<T>(key: string, data: T, ttl?: number) => {
    cache.current.set(key, data, ttl);
    updateStats();
  }, [updateStats]);

  const get = useCallback(<T>(key: string): T | null => {
    const result = cache.current.get<T>(key);
    updateStats();
    return result;
  }, [updateStats]);

  const invalidate = useCallback((pattern: string) => {
    cache.current.invalidate(pattern);
    updateStats();
  }, [updateStats]);

  const clear = useCallback(() => {
    cache.current.clear();
    updateStats();
  }, [updateStats]);

  return {
    set,
    get,
    invalidate,
    clear,
    stats
  };
};
