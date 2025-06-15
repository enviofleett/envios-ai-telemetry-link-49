import { googleMapsGeocodingService } from '@/services/googleMaps/googleMapsGeocodingService';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import { databaseGeocodingService } from './databaseGeocodingService';
import { useToast } from '@/hooks/use-toast';

export type GeocodingProvider = 'google-maps' | 'maptiler';

export interface EnhancedGeocodingConfig {
  primaryProvider: GeocodingProvider;
  fallbackProvider: GeocodingProvider;
  retryAttempts: number;
  cacheEnabled: boolean;
  databasePersistence: boolean;
}

class EnhancedUnifiedGeocodingService {
  private config: EnhancedGeocodingConfig = {
    primaryProvider: 'google-maps',
    fallbackProvider: 'maptiler',
    retryAttempts: 2,
    cacheEnabled: true,
    databasePersistence: true
  };

  private metrics = {
    totalRequests: 0,
    googleMapsSuccess: 0,
    mapTilerSuccess: 0,
    googleMapsFailures: 0,
    mapTilerFailures: 0,
    cacheHits: 0,
    databaseCacheHits: 0
  };

  async initialize(): Promise<void> {
    await Promise.all([
      googleMapsGeocodingService.initialize(),
      mapTilerService.initialize()
    ]);

    // Load configuration from database to check which providers are configured
    await this.loadConfigurationFromDatabase();
    
    console.log('Enhanced unified geocoding service initialized for secure, proxied requests.');
  }

  private async loadConfigurationFromDatabase(): Promise<void> {
    try {
      const [googleConfig, mapTilerConfig] = await Promise.all([
        databaseGeocodingService.getGeocodingConfiguration('google-maps'),
        databaseGeocodingService.getGeocodingConfiguration('maptiler')
      ]);

      // SECURITY FIX: Removed API key decryption and local storage.
      // The client no longer needs to know the API keys. It only needs to
      // know which providers are configured to make proxied requests.
      if (googleConfig?.api_key_encrypted) {
        googleMapsGeocodingService.setIsConfigured(true);
      }

      if (mapTilerConfig?.api_key_encrypted) {
        mapTilerService.setIsConfigured(true);
      }
      
      // Update primary provider based on database config
      if (googleConfig?.primary_provider) {
        this.config.primaryProvider = 'google-maps';
        this.config.fallbackProvider = 'maptiler';
      } else if (mapTilerConfig?.primary_provider) {
        this.config.primaryProvider = 'maptiler';
        this.config.fallbackProvider = 'google-maps';
      }

    } catch (error) {
      console.error('Error loading configuration from database:', error);
    }
  }

  updateConfig(newConfig: Partial<EnhancedGeocodingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Enhanced geocoding config updated:', this.config);
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    this.metrics.totalRequests++;
    const startTime = Date.now();

    // Check database cache first if enabled
    if (this.config.cacheEnabled && this.config.databasePersistence) {
      const cachedAddress = await databaseGeocodingService.getCachedAddress(lat, lon);
      if (cachedAddress) {
        this.metrics.databaseCacheHits++;
        
        // Log usage
        await databaseGeocodingService.logGeocodingUsage({
          user_id: '', // Will be set by RLS policy
          provider_name: 'cache',
          request_type: 'reverse_geocode',
          latitude: lat,
          longitude: lon,
          address_result: cachedAddress,
          response_time_ms: Date.now() - startTime,
          success: true,
          cache_hit: true
        });

        return cachedAddress;
      }
    }

    const providers = this.getProviderOrder();
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const address = await this.geocodeWithProvider(provider, lat, lon);
        const responseTime = Date.now() - startTime;
        
        this.recordSuccess(provider);

        // Cache the result in database if enabled
        if (this.config.cacheEnabled && this.config.databasePersistence) {
          await databaseGeocodingService.cacheAddress(lat, lon, address, provider);
        }

        // Log successful usage
        await databaseGeocodingService.logGeocodingUsage({
          user_id: '', // Will be set by RLS policy
          provider_name: provider,
          request_type: 'reverse_geocode',
          latitude: lat,
          longitude: lon,
          address_result: address,
          response_time_ms: responseTime,
          success: true,
          cache_hit: false
        });

        return address;
      } catch (error) {
        lastError = error as Error;
        this.recordFailure(provider);
        
        // Log failed usage
        await databaseGeocodingService.logGeocodingUsage({
          user_id: '', // Will be set by RLS policy
          provider_name: provider,
          request_type: 'reverse_geocode',
          latitude: lat,
          longitude: lon,
          response_time_ms: Date.now() - startTime,
          success: false,
          error_message: lastError.message,
          cache_hit: false
        });

        console.warn(`Enhanced geocoding failed with ${provider}:`, error);
      }
    }

    // If all providers fail, return coordinates
    const fallbackAddress = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    console.error('All enhanced geocoding providers failed, returning coordinates:', lastError);
    return fallbackAddress;
  }

  async saveProviderConfiguration(
    provider: GeocodingProvider, 
    apiKey: string, 
    isPrimary: boolean = false
  ): Promise<boolean> {
    try {
      // This now calls the secure edge function via databaseGeocodingService
      const success = await databaseGeocodingService.saveGeocodingConfiguration(
        provider, 
        apiKey, 
        isPrimary
      );

      if (success) {
        // Update local services state to reflect that it is now configured.
        if (provider === 'google-maps') {
          googleMapsGeocodingService.setIsConfigured(true);
        } else if (provider === 'maptiler') {
          mapTilerService.setIsConfigured(true);
        }

        // Update config
        if (isPrimary) {
          this.config.primaryProvider = provider;
          this.config.fallbackProvider = provider === 'google-maps' ? 'maptiler' : 'google-maps';
        }
      }

      return success;
    } catch (error) {
      console.error('Error saving provider configuration:', error);
      return false;
    }
  }

  async testConnection(provider?: GeocodingProvider): Promise<{ [key in GeocodingProvider]?: boolean }> {
    const results: { [key in GeocodingProvider]?: boolean } = {};
    const providersToTest = provider ? [provider] : (['google-maps', 'maptiler'] as GeocodingProvider[]);

    for (const testProvider of providersToTest) {
      if (this.isProviderConfigured(testProvider)) {
        try {
          await this.geocodeWithProvider(testProvider, 40.7128, -74.0060); // Test with NYC coordinates
          results[testProvider] = true;
          await databaseGeocodingService.updateTestStatus(testProvider, 'success');
        } catch (error) {
          results[testProvider] = false;
          await databaseGeocodingService.updateTestStatus(
            testProvider, 
            'failed', 
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    }

    return results;
  }

  private getProviderOrder(): GeocodingProvider[] {
    const providers: GeocodingProvider[] = [];
    
    // Add primary provider if configured
    if (this.isProviderConfigured(this.config.primaryProvider)) {
      providers.push(this.config.primaryProvider);
    }
    
    // Add fallback provider if configured and different from primary
    if (this.isProviderConfigured(this.config.fallbackProvider) && 
        this.config.fallbackProvider !== this.config.primaryProvider) {
      providers.push(this.config.fallbackProvider);
    }

    // Ensure we have at least one provider
    if (providers.length === 0) {
      if (mapTilerService.isConfigured()) providers.push('maptiler');
      if (googleMapsGeocodingService.isConfigured()) providers.push('google-maps');
    }

    return providers;
  }

  private isProviderConfigured(provider: GeocodingProvider): boolean {
    switch (provider) {
      case 'google-maps':
        return googleMapsGeocodingService.isConfigured();
      case 'maptiler':
        return mapTilerService.isConfigured();
      default:
        return false;
    }
  }

  private async geocodeWithProvider(provider: GeocodingProvider, lat: number, lon: number): Promise<string> {
    switch (provider) {
      case 'google-maps':
        return await googleMapsGeocodingService.reverseGeocode(lat, lon);
      case 'maptiler':
        return await mapTilerService.reverseGeocode(lat, lon);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private recordSuccess(provider: GeocodingProvider): void {
    switch (provider) {
      case 'google-maps':
        this.metrics.googleMapsSuccess++;
        break;
      case 'maptiler':
        this.metrics.mapTilerSuccess++;
        break;
    }
  }

  private recordFailure(provider: GeocodingProvider): void {
    switch (provider) {
      case 'google-maps':
        this.metrics.googleMapsFailures++;
        break;
      case 'maptiler':
        this.metrics.mapTilerFailures++;
        break;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getConfig() {
    return { ...this.config };
  }

  async clearAllCaches(): Promise<void> {
    googleMapsGeocodingService.clearCache();
    mapTilerService.clearCache();
    
    // Clear database cache (optional - could be expensive)
    console.log('Local caches cleared. Database cache remains for performance.');
  }

  async getCacheStats() {
    const stats = await databaseGeocodingService.getGeocodingStatistics();
    return {
      googleMaps: googleMapsGeocodingService.getCacheStats(),
      mapTiler: mapTilerService.getCacheStats(),
      database: stats || {}
    };
  }
}

export const enhancedUnifiedGeocodingService = new EnhancedUnifiedGeocodingService();
