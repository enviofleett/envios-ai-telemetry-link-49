
export interface MapIntegrationProps {
  showVehicles?: boolean;
  showGeofences?: boolean;
  showRoutes?: boolean;
  height?: string;
  interactive?: boolean;
  clustered?: boolean;
  enableLocationServices?: boolean;
  onVehicleSelect?: (vehicle: any) => void;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export interface LocationContext {
  coordinates: { lat: number; lng: number };
  address?: string;
  city?: string;
  country?: string;
  formatted?: string;
}

export interface GeocodingResult {
  coordinates: { lat: number; lng: number };
  address: string;
  confidence: number;
}
