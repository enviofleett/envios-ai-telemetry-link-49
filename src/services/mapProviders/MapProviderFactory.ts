
import { MapProvider, MapProviderType } from '@/types/mapProviders';
import { MapTilerProvider } from './MapTilerProvider';
import { MapboxProvider } from './MapboxProvider';

export class MapProviderFactory {
  static create(providerType: MapProviderType): MapProvider {
    switch (providerType) {
      case 'maptiler':
        return new MapTilerProvider();
      case 'mapbox':
        return new MapboxProvider();
      case 'google':
        // TODO: Implement Google Maps provider
        throw new Error('Google Maps provider not yet implemented');
      case 'leaflet':
        // TODO: Implement Leaflet provider
        throw new Error('Leaflet provider not yet implemented');
      default:
        throw new Error(`Unsupported map provider: ${providerType}`);
    }
  }

  static getSupportedProviders(): MapProviderType[] {
    return ['maptiler', 'mapbox'];
  }

  static isProviderSupported(providerType: string): boolean {
    return this.getSupportedProviders().includes(providerType as MapProviderType);
  }
}
