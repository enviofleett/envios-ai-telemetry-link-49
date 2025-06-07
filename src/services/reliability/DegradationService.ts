
export type ServiceLevel = 'full' | 'degraded' | 'minimal' | 'offline';

export interface DegradationConfig {
  service: string;
  currentLevel: ServiceLevel;
  allowedLevels: ServiceLevel[];
  fallbackData?: any;
  lastUpdated: number;
  autoRecovery: boolean;
  recoveryThreshold: number;
}

export interface ServiceStatus {
  name: string;
  level: ServiceLevel;
  isHealthy: boolean;
  lastError?: string;
  lastSuccessTime?: number;
  consecutiveFailures: number;
  fallbackActive: boolean;
}

export class DegradationService {
  private static instance: DegradationService;
  private services = new Map<string, DegradationConfig>();
  private fallbackData = new Map<string, any>();
  private subscribers = new Map<string, ((status: ServiceStatus) => void)[]>();

  private readonly DEFAULT_CONFIG: Partial<DegradationConfig> = {
    currentLevel: 'full',
    allowedLevels: ['full', 'degraded', 'minimal', 'offline'],
    autoRecovery: true,
    recoveryThreshold: 3
  };

  static getInstance(): DegradationService {
    if (!DegradationService.instance) {
      DegradationService.instance = new DegradationService();
    }
    return DegradationService.instance;
  }

  registerService(
    serviceName: string, 
    config?: Partial<DegradationConfig>
  ): void {
    const fullConfig: DegradationConfig = {
      service: serviceName,
      lastUpdated: Date.now(),
      ...this.DEFAULT_CONFIG,
      ...config
    } as DegradationConfig;

    this.services.set(serviceName, fullConfig);
    console.log(`Registered service for degradation management: ${serviceName}`);
  }

  async executeWithDegradation<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallbackStrategies?: {
      degraded?: () => Promise<T>;
      minimal?: () => Promise<T>;
      offline?: () => T;
    }
  ): Promise<T> {
    const config = this.services.get(serviceName);
    if (!config) {
      throw new Error(`Service ${serviceName} not registered for degradation management`);
    }

    try {
      // Check if service is available at current level
      if (config.currentLevel === 'offline') {
        if (fallbackStrategies?.offline) {
          console.log(`Service ${serviceName} is offline, using offline fallback`);
          return fallbackStrategies.offline();
        }
        throw new Error(`Service ${serviceName} is offline and no offline fallback provided`);
      }

      // Try the main operation
      const result = await operation();
      
      // Success - potentially recover service level
      this.handleSuccess(serviceName);
      return result;

    } catch (error) {
      console.error(`Service ${serviceName} operation failed:`, error);
      
      // Handle failure and potentially degrade
      this.handleFailure(serviceName, error as Error);
      
      // Try fallback strategies based on current degradation level
      return await this.executeFallback(serviceName, fallbackStrategies, error as Error);
    }
  }

  private async executeFallback<T>(
    serviceName: string,
    fallbackStrategies?: {
      degraded?: () => Promise<T>;
      minimal?: () => Promise<T>;
      offline?: () => T;
    },
    originalError?: Error
  ): Promise<T> {
    const config = this.services.get(serviceName)!;

    switch (config.currentLevel) {
      case 'degraded':
        if (fallbackStrategies?.degraded) {
          console.log(`Using degraded mode for service ${serviceName}`);
          try {
            return await fallbackStrategies.degraded();
          } catch (fallbackError) {
            console.error(`Degraded mode failed for ${serviceName}:`, fallbackError);
            this.degradeService(serviceName, 'minimal');
            return await this.executeFallback(serviceName, fallbackStrategies, originalError);
          }
        }
        // Fall through to minimal if no degraded strategy
        this.degradeService(serviceName, 'minimal');
        return await this.executeFallback(serviceName, fallbackStrategies, originalError);

      case 'minimal':
        if (fallbackStrategies?.minimal) {
          console.log(`Using minimal mode for service ${serviceName}`);
          try {
            return await fallbackStrategies.minimal();
          } catch (fallbackError) {
            console.error(`Minimal mode failed for ${serviceName}:`, fallbackError);
            this.degradeService(serviceName, 'offline');
            return await this.executeFallback(serviceName, fallbackStrategies, originalError);
          }
        }
        // Fall through to offline if no minimal strategy
        this.degradeService(serviceName, 'offline');
        return await this.executeFallback(serviceName, fallbackStrategies, originalError);

      case 'offline':
        if (fallbackStrategies?.offline) {
          console.log(`Using offline mode for service ${serviceName}`);
          return fallbackStrategies.offline();
        }
        break;
    }

    // No fallback available
    throw originalError || new Error(`Service ${serviceName} failed and no fallback available`);
  }

  private handleSuccess(serviceName: string): void {
    const config = this.services.get(serviceName);
    if (!config) return;

    // Reset consecutive failures
    config.consecutiveFailures = 0;
    config.lastSuccessTime = Date.now();

    // Auto-recovery logic
    if (config.autoRecovery && config.currentLevel !== 'full') {
      const successfulRecoveries = config.consecutiveFailures === 0 ? 1 : 0;
      
      if (successfulRecoveries >= config.recoveryThreshold) {
        this.recoverService(serviceName);
      }
    }

    this.notifySubscribers(serviceName);
  }

  private handleFailure(serviceName: string, error: Error): void {
    const config = this.services.get(serviceName);
    if (!config) return;

    config.consecutiveFailures = (config.consecutiveFailures || 0) + 1;
    config.lastError = error.message;
    config.lastUpdated = Date.now();

    // Auto-degrade based on failure count
    if (config.consecutiveFailures >= 3 && config.currentLevel === 'full') {
      this.degradeService(serviceName, 'degraded');
    } else if (config.consecutiveFailures >= 5 && config.currentLevel === 'degraded') {
      this.degradeService(serviceName, 'minimal');
    } else if (config.consecutiveFailures >= 10 && config.currentLevel === 'minimal') {
      this.degradeService(serviceName, 'offline');
    }

    this.notifySubscribers(serviceName);
  }

  degradeService(serviceName: string, targetLevel: ServiceLevel): void {
    const config = this.services.get(serviceName);
    if (!config || !config.allowedLevels.includes(targetLevel)) {
      console.warn(`Cannot degrade service ${serviceName} to ${targetLevel}`);
      return;
    }

    const previousLevel = config.currentLevel;
    config.currentLevel = targetLevel;
    config.lastUpdated = Date.now();

    console.log(`Service ${serviceName} degraded from ${previousLevel} to ${targetLevel}`);
    this.notifySubscribers(serviceName);
  }

  recoverService(serviceName: string): void {
    const config = this.services.get(serviceName);
    if (!config) return;

    const levels: ServiceLevel[] = ['offline', 'minimal', 'degraded', 'full'];
    const currentIndex = levels.indexOf(config.currentLevel);
    
    if (currentIndex < levels.length - 1) {
      const newLevel = levels[currentIndex + 1];
      const previousLevel = config.currentLevel;
      config.currentLevel = newLevel;
      config.lastUpdated = Date.now();
      
      console.log(`Service ${serviceName} recovered from ${previousLevel} to ${newLevel}`);
      this.notifySubscribers(serviceName);
    }
  }

  // Cached data management for fallbacks
  setCachedData(serviceName: string, key: string, data: any, ttl?: number): void {
    const cacheKey = `${serviceName}:${key}`;
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || 300000 // 5 minutes default
    };
    
    this.fallbackData.set(cacheKey, cacheEntry);
  }

  getCachedData(serviceName: string, key: string): any | null {
    const cacheKey = `${serviceName}:${key}`;
    const entry = this.fallbackData.get(cacheKey);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.fallbackData.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }

  // Status and monitoring
  getServiceStatus(serviceName: string): ServiceStatus | null {
    const config = this.services.get(serviceName);
    if (!config) return null;

    return {
      name: serviceName,
      level: config.currentLevel,
      isHealthy: config.currentLevel === 'full' && (config.consecutiveFailures || 0) === 0,
      lastError: config.lastError,
      lastSuccessTime: config.lastSuccessTime,
      consecutiveFailures: config.consecutiveFailures || 0,
      fallbackActive: config.currentLevel !== 'full'
    };
  }

  getAllServiceStatuses(): ServiceStatus[] {
    return Array.from(this.services.keys()).map(name => this.getServiceStatus(name)!);
  }

  // Subscription management
  subscribe(serviceName: string, callback: (status: ServiceStatus) => void): () => void {
    if (!this.subscribers.has(serviceName)) {
      this.subscribers.set(serviceName, []);
    }
    
    this.subscribers.get(serviceName)!.push(callback);
    
    // Send initial status
    const status = this.getServiceStatus(serviceName);
    if (status) {
      callback(status);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(serviceName);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifySubscribers(serviceName: string): void {
    const callbacks = this.subscribers.get(serviceName);
    const status = this.getServiceStatus(serviceName);
    
    if (callbacks && status) {
      callbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error(`Error notifying degradation subscriber for ${serviceName}:`, error);
        }
      });
    }
  }

  // Manual controls
  forceServiceLevel(serviceName: string, level: ServiceLevel): void {
    const config = this.services.get(serviceName);
    if (config && config.allowedLevels.includes(level)) {
      config.currentLevel = level;
      config.lastUpdated = Date.now();
      console.log(`Manually set service ${serviceName} to ${level}`);
      this.notifySubscribers(serviceName);
    }
  }

  resetService(serviceName: string): void {
    const config = this.services.get(serviceName);
    if (config) {
      config.currentLevel = 'full';
      config.consecutiveFailures = 0;
      config.lastError = undefined;
      config.lastSuccessTime = Date.now();
      config.lastUpdated = Date.now();
      console.log(`Reset service ${serviceName} to full operation`);
      this.notifySubscribers(serviceName);
    }
  }
}

export const degradationService = DegradationService.getInstance();
