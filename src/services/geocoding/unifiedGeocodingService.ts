
import { googleMapsGeocodingService } from '@/services/googleMaps/googleMapsGeocodingService';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';

export type GeocodingProvider = 'google-maps' | 'maptiler';

export interface GeocodingConfig {
  primaryProvider: GeocodingProvider;
  fallbackProvider: GeocodingProvider;
  retryAttempts: number;
  cacheEnabled: boolean;
}

class UnifiedGeocodingService {
  private config: GeocodingConfig = {
    primaryProvider: 'google-maps',
    fallbackProvider: 'maptiler',
    retryAttempts: 2,
    cacheEnabled: true
  };

  private metrics = {
    totalRequests: 0,
    googleMapsSuccess: 0,
    mapTilerSuccess: 0,
    googleMapsFailures: 0,
    mapTilerFailures: 0,
    cacheHits: 0
  };

  async initialize(): Promise<void> {
    await Promise.all([
      googleMapsGeocodingService.initialize(),
      mapTilerService.initialize()
    ]);
    console.log('Unified geocoding service initialized');
  }

  updateConfig(newConfig: Partial<GeocodingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Geocoding config updated:', this.config);
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    this.metrics.totalRequests++;

    const providers = this.getProviderOrder();
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const address = await this.geocodeWithProvider(provider, lat, lon);
        this.recordSuccess(provider);
        return address;
      } catch (error) {
        lastError = error as Error;
        this.recordFailure(provider);
        console.warn(`Geocoding failed with ${provider}:`, error);
      }
    }

    // If all providers fail, return coordinates
    const fallbackAddress = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    console.error('All geocoding providers failed, returning coordinates:', lastError);
    return fallbackAddress;
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

  async testConnection(): Promise<{ [key in GeocodingProvider]?: boolean }> {
    const results: { [key in GeocodingProvider]?: boolean } = {};

    if (googleMapsGeocodingService.isConfigured()) {
      try {
        await googleMapsGeocodingService.testConnection();
        results['google-maps'] = true;
      } catch (error) {
        results['google-maps'] = false;
      }
    }

    if (mapTilerService.isConfigured()) {
      try {
        await mapTilerService.testConnection();
        results['maptiler'] = true;
      } catch (error) {
        results['maptiler'] = false;
      }
    }

    return results;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getConfig() {
    return { ...this.config };
  }

  clearAllCaches(): void {
    googleMapsGeocodingService.clearCache();
    mapTilerService.clearCache();
  }

  getCacheStats() {
    return {
      googleMaps: googleMapsGeocodingService.getCacheStats(),
      mapTiler: mapTilerService.getCacheStats()
    };
  }
}

export const unifiedGeocodingService = new UnifiedGeocodingService();
