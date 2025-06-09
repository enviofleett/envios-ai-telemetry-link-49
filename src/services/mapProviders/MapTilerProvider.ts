import { MapProvider, MapProviderOptions, MarkerOptions, Vehicle } from '@/types/mapProviders';
import mapboxgl from 'mapbox-gl';

export class MapTilerProvider implements MapProvider {
  private map: mapboxgl.Map | null = null;
  private markers: Map<string, mapboxgl.Marker> = new Map();
  private clusteredMarkers: any = null;
  private clickCallback: ((lat: number, lng: number) => void) | null = null;
  private isDestroyed: boolean = false;
  private lastVehicleHash: string = '';

  async initialize(apiKey: string, container: HTMLElement, options: MapProviderOptions = {}): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Provider has been destroyed');
    }

    try {
      // Clear any existing map
      if (this.map) {
        this.destroy();
      }

      // Validate container
      if (!container || !container.isConnected) {
        throw new Error('Invalid container element');
      }

      console.log('🗺️ Initializing MapTiler provider...');

      this.map = new mapboxgl.Map({
        container: container,
        style: options.style || `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
        center: options.center || [0, 0],
        zoom: options.zoom || 2,
        interactive: options.interactive !== false,
        attributionControl: false
      });

      // Add navigation controls
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      this.map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

      // Wait for map to load with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Map load timeout'));
        }, 10000);

        this.map!.on('load', () => {
          clearTimeout(timeout);
          resolve(void 0);
        });

        this.map!.on('error', (e) => {
          clearTimeout(timeout);
          reject(e.error || new Error('Map load error'));
        });
      });

      console.log('✅ MapTiler provider initialized successfully');
    } catch (error) {
      console.error('❌ MapTiler provider initialization failed:', error);
      this.cleanup();
      throw error;
    }
  }

  private cleanup(): void {
    if (this.map) {
      try {
        this.removeAllMarkers();
        this.map.remove();
      } catch (error) {
        console.warn('Error during map cleanup:', error);
      }
      this.map = null;
    }
    this.markers.clear();
    this.lastVehicleHash = '';
  }

  destroy(): void {
    this.isDestroyed = true;
    this.cleanup();
  }

  addVehicleMarkers(vehicles: Vehicle[]): void {
    if (!this.map || this.isDestroyed) return;

    // Create hash to detect changes
    const vehicleHash = vehicles.map(v => 
      `${v.deviceid}-${v.lastPosition?.lat}-${v.lastPosition?.lon}-${v.lastPosition?.updatetime}`
    ).join('|');

    // Skip if vehicles haven't changed
    if (vehicleHash === this.lastVehicleHash) {
      return;
    }

    this.lastVehicleHash = vehicleHash;

    // Remove existing markers
    this.removeAllMarkers();

    const validVehicles = vehicles.filter(vehicle => 
      vehicle.lastPosition?.lat && 
      vehicle.lastPosition?.lon &&
      !isNaN(vehicle.lastPosition.lat) &&
      !isNaN(vehicle.lastPosition.lon)
    );

    console.log(`🚗 Adding ${validVehicles.length} vehicle markers`);

    // Add new markers in batch
    validVehicles.forEach(vehicle => {
      try {
        const status = this.getVehicleStatus(vehicle);
        this.addMarker(
          vehicle.lastPosition!.lat,
          vehicle.lastPosition!.lon,
          {
            title: vehicle.devicename,
            status: status,
            popup: this.createVehiclePopup(vehicle),
            onClick: () => {
              console.log('Vehicle selected:', vehicle);
            }
          }
        );
      } catch (error) {
        console.warn(`Error adding marker for vehicle ${vehicle.deviceid}:`, error);
      }
    });

    // Fit bounds if we have markers
    if (validVehicles.length > 0) {
      this.fitToVehicles(validVehicles);
    }
  }

  private fitToVehicles(vehicles: Vehicle[]): void {
    if (!this.map || vehicles.length === 0) return;

    try {
      const bounds = new mapboxgl.LngLatBounds();
      
      vehicles.forEach(vehicle => {
        if (vehicle.lastPosition?.lat && vehicle.lastPosition?.lon) {
          bounds.extend([vehicle.lastPosition.lon, vehicle.lastPosition.lat]);
        }
      });

      if (!bounds.isEmpty()) {
        this.map.fitBounds(bounds, { 
          padding: 50, 
          maxZoom: 15,
          duration: 1000
        });
      }
    } catch (error) {
      console.warn('Error fitting bounds:', error);
    }
  }

  private getVehicleStatus(vehicle: Vehicle): 'online' | 'idle' | 'offline' {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  }

  private createVehiclePopup(vehicle: Vehicle): string {
    const status = this.getVehicleStatus(vehicle);
    const lastUpdate = vehicle.lastPosition?.updatetime 
      ? new Date(vehicle.lastPosition.updatetime).toLocaleString()
      : 'Never';

    return `
      <div class="p-3 min-w-[200px]">
        <h3 class="font-semibold text-lg mb-2">${vehicle.devicename}</h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span>Status:</span>
            <span class="px-2 py-1 rounded text-xs ${
              status === 'online' ? 'bg-green-100 text-green-800' :
              status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }">${status}</span>
          </div>
          <div class="flex justify-between">
            <span>Speed:</span>
            <span>${vehicle.lastPosition?.speed || 0} km/h</span>
          </div>
          <div class="flex justify-between">
            <span>Last Update:</span>
            <span>${lastUpdate}</span>
          </div>
          <div class="flex justify-between">
            <span>Device ID:</span>
            <span class="font-mono text-xs">${vehicle.deviceid}</span>
          </div>
        </div>
      </div>
    `;
  }

  removeAllMarkers(): void {
    this.markers.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
    });
    this.markers.clear();
  }

  setCenter(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;
    this.map.setCenter([lng, lat]);
    if (zoom !== undefined) {
      this.map.setZoom(zoom);
    }
  }

  getCenter(): { lat: number; lng: number } {
    if (!this.map) return { lat: 0, lng: 0 };
    const center = this.map.getCenter();
    return { lat: center.lat, lng: center.lng };
  }

  setZoom(zoom: number): void {
    if (!this.map) return;
    this.map.setZoom(zoom);
  }

  getZoom(): number {
    return this.map?.getZoom() || 0;
  }

  fitBounds(bounds: [[number, number], [number, number]]): void {
    if (!this.map) return;
    this.map.fitBounds(bounds as mapboxgl.LngLatBoundsLike);
  }

  addClickListener(callback: (lat: number, lng: number) => void): void {
    if (!this.map) return;
    this.clickCallback = callback;
    this.map.on('click', (e) => {
      callback(e.lngLat.lat, e.lngLat.lng);
    });
  }

  removeClickListener(): void {
    if (!this.map || !this.clickCallback) return;
    this.map.off('click', this.clickCallback as any);
    this.clickCallback = null;
  }

  addMarker(lat: number, lng: number, options: MarkerOptions = {}): string {
    if (!this.map || this.isDestroyed) return '';

    const markerId = `marker_${Date.now()}_${Math.random()}`;
    
    try {
      // Create marker element
      const el = document.createElement('div');
      el.className = 'vehicle-marker';
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
      `;

      // Set color based on vehicle status
      switch (options.status) {
        case 'online':
          el.style.backgroundColor = '#10b981';
          break;
        case 'idle':
          el.style.backgroundColor = '#f59e0b';
          break;
        case 'offline':
          el.style.backgroundColor = '#ef4444';
          break;
        default:
          el.style.backgroundColor = '#6b7280';
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat]);

      if (options.popup) {
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(options.popup);
        marker.setPopup(popup);
      }

      if (options.onClick) {
        el.addEventListener('click', options.onClick);
      }

      // Add hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      marker.addTo(this.map);
      this.markers.set(markerId, marker);
      
      return markerId;
    } catch (error) {
      console.warn('Error adding marker:', error);
      return '';
    }
  }

  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.remove();
      this.markers.delete(markerId);
    }
  }

  updateMarker(markerId: string, options: MarkerOptions): void {
    // For simplicity, remove and re-add the marker
    // In a production app, you'd update the existing marker
    this.removeMarker(markerId);
  }

  enableClustering(enabled: boolean): void {
    // MapTiler/Mapbox clustering would require additional setup
    // For now, this is a placeholder
    console.log('Clustering:', enabled ? 'enabled' : 'disabled');
  }

  getProviderName(): string {
    return 'MapTiler';
  }

  isHealthy(): boolean {
    return this.map !== null && !this.isDestroyed;
  }
}
