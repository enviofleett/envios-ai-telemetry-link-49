
import type { VehicleData } from '@/types/vehicle';

export interface ClusterPoint {
  lat: number;
  lng: number;
  vehicles: VehicleData[];
  count: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface ClusteringOptions {
  maxZoom: number;
  radius: number;
  minPoints: number;
  extent: number;
}

export class MarkerClusteringService {
  private defaultOptions: ClusteringOptions = {
    maxZoom: 16,
    radius: 40,
    minPoints: 2,
    extent: 512
  };

  private clusters: Map<number, ClusterPoint[]> = new Map();
  private vehicleTree: any[] = [];

  cluster(vehicles: VehicleData[], zoom: number, options?: Partial<ClusteringOptions>): ClusterPoint[] {
    const opts = { ...this.defaultOptions, ...options };
    
    if (zoom >= opts.maxZoom) {
      // At high zoom levels, don't cluster - show individual markers
      return vehicles.map(vehicle => ({
        lat: vehicle.last_position!.latitude,
        lng: vehicle.last_position!.longitude,
        vehicles: [vehicle],
        count: 1,
        bounds: this.createPointBounds(vehicle.last_position!.latitude, vehicle.last_position!.longitude)
      }));
    }

    // Check cache first
    const cacheKey = this.getCacheKey(vehicles, zoom, opts);
    if (this.clusters.has(cacheKey)) {
      return this.clusters.get(cacheKey)!;
    }

    const clusters = this.performClustering(vehicles, zoom, opts);
    this.clusters.set(cacheKey, clusters);
    return clusters;
  }

  private performClustering(vehicles: VehicleData[], zoom: number, opts: ClusteringOptions): ClusterPoint[] {
    const clusters: ClusterPoint[] = [];
    const processed = new Set<string>();
    const pixelRadius = opts.radius;

    for (const vehicle of vehicles) {
      if (!vehicle.last_position || processed.has(vehicle.device_id)) {
        continue;
      }

      const cluster: ClusterPoint = {
        lat: vehicle.last_position.latitude,
        lng: vehicle.last_position.longitude,
        vehicles: [vehicle],
        count: 1,
        bounds: this.createPointBounds(vehicle.last_position.latitude, vehicle.last_position.longitude)
      };

      processed.add(vehicle.device_id);

      // Find nearby vehicles within clustering radius
      for (const otherVehicle of vehicles) {
        if (!otherVehicle.last_position || 
            processed.has(otherVehicle.device_id) || 
            otherVehicle.device_id === vehicle.device_id) {
          continue;
        }

        const distance = this.getPixelDistance(
          vehicle.last_position.latitude,
          vehicle.last_position.longitude,
          otherVehicle.last_position.latitude,
          otherVehicle.last_position.longitude,
          zoom
        );

        if (distance <= pixelRadius) {
          cluster.vehicles.push(otherVehicle);
          cluster.count++;
          processed.add(otherVehicle.device_id);
          this.updateClusterBounds(cluster, otherVehicle.last_position.latitude, otherVehicle.last_position.longitude);
        }
      }

      // Update cluster center to be the centroid
      if (cluster.count > 1) {
        const { lat, lng } = this.calculateCentroid(cluster.vehicles);
        cluster.lat = lat;
        cluster.lng = lng;
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  private getPixelDistance(lat1: number, lng1: number, lat2: number, lng2: number, zoom: number): number {
    const earthRadius = 6371000; // Earth's radius in meters
    const pixelsPerMeter = (256 * Math.pow(2, zoom)) / (2 * Math.PI * earthRadius);
    
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const distance = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * earthRadius;
    return distance * pixelsPerMeter;
  }

  private calculateCentroid(vehicles: VehicleData[]): { lat: number; lng: number } {
    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    for (const vehicle of vehicles) {
      if (vehicle.last_position) {
        totalLat += vehicle.last_position.latitude;
        totalLng += vehicle.last_position.longitude;
        count++;
      }
    }

    return {
      lat: count > 0 ? totalLat / count : 0,
      lng: count > 0 ? totalLng / count : 0
    };
  }

  private createPointBounds(lat: number, lng: number) {
    return {
      north: lat,
      south: lat,
      east: lng,
      west: lng
    };
  }

  private updateClusterBounds(cluster: ClusterPoint, lat: number, lng: number) {
    cluster.bounds.north = Math.max(cluster.bounds.north, lat);
    cluster.bounds.south = Math.min(cluster.bounds.south, lat);
    cluster.bounds.east = Math.max(cluster.bounds.east, lng);
    cluster.bounds.west = Math.min(cluster.bounds.west, lng);
  }

  private getCacheKey(vehicles: VehicleData[], zoom: number, options: ClusteringOptions): number {
    const vehicleHash = vehicles.length;
    const optionsHash = JSON.stringify(options);
    return `${vehicleHash}-${zoom}-${optionsHash}`.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
  }

  clearCache() {
    this.clusters.clear();
  }

  getCacheStats() {
    return {
      cacheSize: this.clusters.size,
      memoryUsage: JSON.stringify([...this.clusters.entries()]).length
    };
  }
}

export const markerClusteringService = new MarkerClusteringService();
