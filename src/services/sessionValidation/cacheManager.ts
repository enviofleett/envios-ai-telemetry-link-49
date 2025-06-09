
import { EnhancedSessionResult, SessionCache } from './types';

export class SessionCacheManager {
  private static cache: SessionCache = {
    result: null,
    lastValidation: null
  };

  static isCacheValid(): boolean {
    if (!this.cache.result || !this.cache.lastValidation) {
      return false;
    }

    const cacheAge = Date.now() - this.cache.lastValidation.getTime();
    const maxCacheAge = this.cache.result.valid ? 30000 : 10000; // 30s for valid, 10s for invalid

    return cacheAge < maxCacheAge;
  }

  static getCachedResult(): EnhancedSessionResult | null {
    return this.cache.result;
  }

  static setCachedResult(result: EnhancedSessionResult): void {
    this.cache.result = result;
    this.cache.lastValidation = new Date();
  }

  static clearCache(): void {
    this.cache.result = null;
    this.cache.lastValidation = null;
  }
}
