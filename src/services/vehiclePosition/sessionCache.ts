
import { SessionValidationResult } from './types';

export class GP51SessionCache {
  private static lastCheck: Date | null = null;
  private static cachedResult: SessionValidationResult | null = null;

  static isCacheValid(): boolean {
    if (!this.cachedResult || !this.lastCheck) {
      return false;
    }

    const cacheAge = Date.now() - this.lastCheck.getTime();
    const maxAge = this.cachedResult.valid ? 30000 : 5000; // 30s valid, 5s invalid

    return cacheAge < maxAge;
  }

  static getCachedResult(): SessionValidationResult | null {
    return this.cachedResult;
  }

  static setCachedResult(result: SessionValidationResult): SessionValidationResult {
    this.cachedResult = result;
    this.lastCheck = new Date();
    return result;
  }

  static clearCache(): void {
    this.cachedResult = null;
    this.lastCheck = null;
  }
}
