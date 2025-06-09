
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

// Unified MapConfig interface that matches the complete database schema
export interface MapConfig {
  id: string;
  name: string;
  api_key: string;
  provider_type: string;
  threshold_type: string;
  threshold_value: number;
  is_active: boolean;
  fallback_priority: number;
  health_status?: string | null;
  response_time_ms?: number | null;
  error_rate?: number | null;
  cost_per_request?: number | null;
  provider_specific_config?: any;
  health_check_url?: string | null;
  health_check_interval?: number | null;
  last_health_check?: string | null;
  alert_threshold_80?: number | null;
  alert_threshold_90?: number | null;
  alert_threshold_95?: number | null;
  auto_fallback_enabled?: boolean | null;
  performance_weight?: number | null;
  last_alert_sent?: string | null;
  created_at?: string;
  updated_at?: string;
  map_api_usage?: Array<{
    usage_date: string;
    request_count: number;
  }>;
}

export type MapProviderType = 'maptiler' | 'mapbox' | 'google' | 'leaflet';

// Type guards for safe type checking
export const isMapConfig = (obj: any): obj is MapConfig => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.api_key === 'string';
};

export const hasHealthStatus = (config: MapConfig): config is MapConfig & { health_status: string } => {
  return config.health_status !== null && config.health_status !== undefined;
};
