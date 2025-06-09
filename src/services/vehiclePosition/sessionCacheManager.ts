
export class SessionCacheManager {
  private static cache: any = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  static isCacheValid(): boolean {
    if (!this.cache || !this.cacheTimestamp) {
      return false;
    }
    
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  static getCachedResult(): any {
    return this.cache;
  }

  static setCachedResult(result: any): void {
    this.cache = result;
    this.cacheTimestamp = Date.now();
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
