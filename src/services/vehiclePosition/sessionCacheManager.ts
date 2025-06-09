
import { SessionValidationResult } from './types';

export class SessionCacheManager {
  private static cache: SessionValidationResult | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  static isCacheValid(): boolean {
    if (!this.cache || !this.cacheTimestamp) {
      return false;
    }
    
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  static getCachedResult(): SessionValidationResult | null {
    return this.cache;
  }

  static setCachedResult(result: SessionValidationResult): SessionValidationResult {
    this.cache = result;
    this.cacheTimestamp = Date.now();
    return result;
  }

  static clearCache(): void {
    console.log('🧹 Clearing session validation cache');
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  static forceExpire(): void {
    console.log('⏰ Force expiring session cache');
    this.cacheTimestamp = 0;
  }
}
