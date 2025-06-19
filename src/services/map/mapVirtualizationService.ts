
import type { VehicleData } from '@/types/vehicle';
import { markerClusteringService, type ClusterPoint } from './markerClusteringService';

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface VirtualizationOptions {
  bufferFactor: number; // How much extra area to load beyond viewport
  maxVehiclesPerView: number;
  enableClustering: boolean;
  updateThrottle: number; // milliseconds
}

export interface VirtualizedMapData {
  visibleVehicles: VehicleData[];
  clusters: ClusterPoint[];
  totalVehicles: number;
  renderLevel: 'individual' | 'clustered' | 'heatmap';
  loadedBounds: ViewportBounds;
}

export class MapVirtualizationService {
  private defaultOptions: VirtualizationOptions = {
    bufferFactor: 1.5, // Load 50% extra area around viewport
    maxVehiclesPerView: 200,
    enableClustering: true,
    updateThrottle: 250
  };

  private lastUpdate = 0;
  private cachedData: Map<string, VirtualizedMapData> = new Map();
  private allVehicles: VehicleData[] = [];

  setVehicleData(vehicles: VehicleData[]) {
    this.allVehicles = vehicles;
    this.clearCache(); // Clear cache when data changes
  }

  virtualizeForViewport(
    viewport: ViewportBounds,
    zoom: number,
    options?: Partial<VirtualizationOptions>
  ): VirtualizedMapData {
    const opts = { ...this.defaultOptions, ...options };
    
    // Throttle updates to prevent excessive calculations
    const now = Date.now();
    if (now - this.lastUpdate < opts.updateThrottle) {
      const cached = this.getCachedData(viewport, zoom);
      if (cached) return cached;
    }
    this.lastUpdate = now;

    // Calculate extended bounds with buffer
    const bufferedBounds = this.calculateBufferedBounds(viewport, opts.bufferFactor);
    
    // Filter vehicles within the buffered viewport
    const vehiclesInView = this.getVehiclesInBounds(bufferedBounds);
    
    // Determine render level based on vehicle count and zoom
    const renderLevel = this.determineRenderLevel(vehiclesInView.length, zoom, opts);
    
    let result: VirtualizedMapData;
    
    switch (renderLevel) {
      case 'individual':
        result = {
          visibleVehicles: vehiclesInView,
          clusters: [],
          totalVehicles: this.allVehicles.length,
          renderLevel,
          loadedBounds: bufferedBounds
        };
        break;
        
      case 'clustered':
        const clusters = markerClusteringService.cluster(vehiclesInView, zoom);
        result = {
          visibleVehicles: [],
          clusters,
          totalVehicles: this.allVehicles.length,
          renderLevel,
          loadedBounds: bufferedBounds
        };
        break;
        
      case 'heatmap':
        // For heatmap, we use a sampled subset of vehicles
        const sampledVehicles = this.sampleVehicles(vehiclesInView, 100);
        result = {
          visibleVehicles: sampledVehicles,
          clusters: [],
          totalVehicles: this.allVehicles.length,
          renderLevel,
          loadedBounds: bufferedBounds
        };
        break;
    }

    // Cache the result
    this.cacheData(viewport, zoom, result);
    
    return result;
  }

  private calculateBufferedBounds(viewport: ViewportBounds, bufferFactor: number): ViewportBounds {
    const latBuffer = (viewport.north - viewport.south) * (bufferFactor - 1) / 2;
    const lngBuffer = (viewport.east - viewport.west) * (bufferFactor - 1) / 2;

    return {
      north: viewport.north + latBuffer,
      south: viewport.south - latBuffer,
      east: viewport.east + lngBuffer,
      west: viewport.west - lngBuffer
    };
  }

  private getVehiclesInBounds(bounds: ViewportBounds): VehicleData[] {
    return this.allVehicles.filter(vehicle => {
      if (!vehicle.last_position) return false;
      
      const { latitude, longitude } = vehicle.last_position;
      
      return latitude >= bounds.south &&
             latitude <= bounds.north &&
             longitude >= bounds.west &&
             longitude <= bounds.east;
    });
  }

  private determineRenderLevel(
    vehicleCount: number, 
    zoom: number, 
    options: VirtualizationOptions
  ): 'individual' | 'clustered' | 'heatmap' {
    // At very high zoom levels, always show individual markers
    if (zoom >= 16) {
      return vehicleCount <= options.maxVehiclesPerView ? 'individual' : 'clustered';
    }
    
    // At low zoom levels with many vehicles, use heatmap
    if (zoom <= 8 && vehicleCount > options.maxVehiclesPerView * 2) {
      return 'heatmap';
    }
    
    // Medium zoom or moderate vehicle count - use clustering
    if (vehicleCount > options.maxVehiclesPerView && options.enableClustering) {
      return 'clustered';
    }
    
    // Default to individual markers
    return 'individual';
  }

  private sampleVehicles(vehicles: VehicleData[], maxSamples: number): VehicleData[] {
    if (vehicles.length <= maxSamples) return vehicles;
    
    const step = Math.floor(vehicles.length / maxSamples);
    const sampled: VehicleData[] = [];
    
    for (let i = 0; i < vehicles.length; i += step) {
      sampled.push(vehicles[i]);
      if (sampled.length >= maxSamples) break;
    }
    
    return sampled;
  }

  private getCachedData(viewport: ViewportBounds, zoom: number): VirtualizedMapData | null {
    const key = this.getCacheKey(viewport, zoom);
    const cached = this.cachedData.get(key);
    
    if (cached) {
      // Check if cached bounds still cover the current viewport
      const bounds = cached.loadedBounds;
      if (viewport.north <= bounds.north &&
          viewport.south >= bounds.south &&
          viewport.east <= bounds.east &&
          viewport.west >= bounds.west) {
        return cached;
      }
    }
    
    return null;
  }

  private cacheData(viewport: ViewportBounds, zoom: number, data: VirtualizedMapData) {
    const key = this.getCacheKey(viewport, zoom);
    this.cachedData.set(key, data);
    
    // Limit cache size to prevent memory issues
    if (this.cachedData.size > 50) {
      const firstKey = this.cachedData.keys().next().value;
      this.cachedData.delete(firstKey);
    }
  }

  private getCacheKey(viewport: ViewportBounds, zoom: number): string {
    const precision = Math.max(0, zoom - 10); // Reduce precision at lower zooms
    const factor = Math.pow(10, precision);
    
    return [
      Math.round(viewport.north * factor),
      Math.round(viewport.south * factor),
      Math.round(viewport.east * factor),
      Math.round(viewport.west * factor),
      zoom
    ].join('-');
  }

  clearCache() {
    this.cachedData.clear();
    markerClusteringService.clearCache();
  }

  getPerformanceStats() {
    return {
      totalVehicles: this.allVehicles.length,
      cacheSize: this.cachedData.size,
      markerClusteringStats: markerClusteringService.getCacheStats(),
      memoryUsage: JSON.stringify([...this.cachedData.entries()]).length
    };
  }

  // Progressive loading for initial map load
  async loadVehiclesProgressively(
    vehicles: VehicleData[],
    onProgress: (loaded: number, total: number) => void,
    batchSize = 50
  ): Promise<void> {
    const batches = Math.ceil(vehicles.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, vehicles.length);
      const batch = vehicles.slice(start, end);
      
      // Add batch to current data
      this.allVehicles.push(...batch);
      
      // Report progress
      onProgress(end, vehicles.length);
      
      // Allow UI to update between batches
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

export const mapVirtualizationService = new MapVirtualizationService();
