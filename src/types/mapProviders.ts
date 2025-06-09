
export interface MapProvider {
  initialize(apiKey: string, container: HTMLElement, options?: MapProviderOptions): Promise<void>;
  destroy(): void;
  addVehicleMarkers(vehicles: Vehicle[]): void;
  removeAllMarkers(): void;
  setCenter(lat: number, lng: number, zoom?: number): void;
  getCenter(): { lat: number; lng: number };
  setZoom(zoom: number): void;
  getZoom(): number;
  fitBounds(bounds: [[number, number], [number, number]]): void;
  addClickListener(callback: (lat: number, lng: number) => void): void;
  removeClickListener(): void;
  addMarker(lat: number, lng: number, options?: MarkerOptions): string;
  removeMarker(markerId: string): void;
  updateMarker(markerId: string, options: MarkerOptions): void;
  enableClustering(enabled: boolean): void;
  getProviderName(): string;
  isHealthy(): boolean;
}

export interface MapProviderOptions {
  zoom?: number;
  center?: [number, number];
  style?: string;
  interactive?: boolean;
  enableClustering?: boolean;
  maxClusterRadius?: number;
}

export interface MarkerOptions {
  color?: string;
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  title?: string;
  popup?: string;
  onClick?: () => void;
  status?: 'online' | 'idle' | 'offline';
}

export interface Vehicle {
  deviceid: string;
  devicename: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed?: number;
    updatetime?: string;
  };
}

export interface MapConfig {
  id: string;
  name: string;
  api_key: string;
  provider_type: string;
  threshold_value: number;
  is_active: boolean;
  fallback_priority: number;
  health_status?: string;
  response_time_ms?: number;
  error_rate?: number;
  cost_per_request?: number;
  provider_specific_config?: Record<string, any>;
}

export type MapProviderType = 'maptiler' | 'mapbox' | 'google' | 'leaflet';
