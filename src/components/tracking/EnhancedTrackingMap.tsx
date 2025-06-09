
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import type { Vehicle } from '@/services/unifiedVehicleData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface EnhancedTrackingMapProps {
  vehicles: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  selectedVehicle?: Vehicle | null;
  height?: string;
  className?: string;
}

const EnhancedTrackingMap: React.FC<EnhancedTrackingMapProps> = ({
  vehicles,
  onVehicleSelect,
  selectedVehicle,
  height = '600px',
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [clusteredVehicles, setClusteredVehicles] = useState<Vehicle[]>([]);

  // Vehicle status helpers
  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#22c55e';
      case 'idle': return '#eab308';
      default: return '#6b7280';
    }
  };

  // Create vehicle marker element
  const createMarkerElement = (vehicle: Vehicle, isCluster = false, clusterCount = 1) => {
    const status = getVehicleStatus(vehicle);
    const element = document.createElement('div');
    element.className = 'vehicle-marker';
    
    if (isCluster) {
      element.innerHTML = `
        <div class="relative cursor-pointer transition-transform hover:scale-110">
          <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
               style="background-color: ${getStatusColor(status)}">
            ${clusterCount}
          </div>
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
        </div>
      `;
    } else {
      const isSelected = selectedVehicle?.deviceid === vehicle.deviceid;
      element.innerHTML = `
        <div class="relative cursor-pointer transition-transform hover:scale-110 ${isSelected ? 'scale-125' : ''}">
          <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg"
               style="background-color: ${getStatusColor(status)}">
          </div>
          ${isSelected ? '<div class="absolute -inset-2 rounded-full border-2 border-blue-500 animate-pulse"></div>' : ''}
        </div>
      `;
    }

    element.addEventListener('click', () => {
      if (isCluster) {
        // Zoom to cluster bounds
        if (map.current) {
          map.current.flyTo({
            center: [vehicle.lastPosition!.lon, vehicle.lastPosition!.lat],
            zoom: map.current.getZoom() + 2
          });
        }
      } else {
        onVehicleSelect?.(vehicle);
      }
    });

    return element;
  };

  // Simple clustering algorithm
  const clusterVehicles = (vehicles: Vehicle[], zoomLevel: number) => {
    const clustered: Vehicle[] = [];
    const processed = new Set<string>();
    const clusterDistance = Math.max(50 / Math.pow(2, zoomLevel - 10), 10);

    vehicles.forEach(vehicle => {
      if (processed.has(vehicle.deviceid) || !vehicle.lastPosition) return;

      const cluster = [vehicle];
      processed.add(vehicle.deviceid);

      vehicles.forEach(other => {
        if (processed.has(other.deviceid) || !other.lastPosition) return;

        const distance = Math.sqrt(
          Math.pow(vehicle.lastPosition!.lat - other.lastPosition!.lat, 2) +
          Math.pow(vehicle.lastPosition!.lon - other.lastPosition!.lon, 2)
        ) * 111000; // Convert to meters

        if (distance < clusterDistance) {
          cluster.push(other);
          processed.add(other.deviceid);
        }
      });

      clustered.push({
        ...vehicle,
        clusterCount: cluster.length,
        isCluster: cluster.length > 1
      } as Vehicle & { clusterCount: number; isCluster: boolean });
    });

    return clustered;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapTilerService.initialize();

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapTilerService.getMapStyle(),
      center: [0, 0],
      zoom: 12,
      attributionControl: false
    });

    // Add controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    map.current.on('zoom', () => {
      if (map.current) {
        const zoomLevel = map.current.getZoom();
        const clustered = clusterVehicles(vehicles, zoomLevel);
        setClusteredVehicles(clustered);
      }
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  // Update markers when vehicles change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    const validVehicles = vehicles.filter(v => 
      v.lastPosition?.lat && 
      v.lastPosition?.lon &&
      !isNaN(v.lastPosition.lat) &&
      !isNaN(v.lastPosition.lon)
    );

    if (validVehicles.length === 0) return;

    // Apply clustering
    const zoomLevel = map.current.getZoom();
    const clustered = clusterVehicles(validVehicles, zoomLevel);
    setClusteredVehicles(clustered);

    // Add markers for clustered vehicles
    clustered.forEach(vehicle => {
      const vehicleData = vehicle as Vehicle & { clusterCount?: number; isCluster?: boolean };
      const element = createMarkerElement(
        vehicle, 
        vehicleData.isCluster, 
        vehicleData.clusterCount
      );
      
      const marker = new maplibregl.Marker(element)
        .setLngLat([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat])
        .addTo(map.current!);

      markers.current.set(vehicle.deviceid, marker);
    });

    // Fit bounds to show all vehicles
    if (validVehicles.length === 1) {
      const vehicle = validVehicles[0];
      map.current.flyTo({
        center: [vehicle.lastPosition!.lon, vehicle.lastPosition!.lat],
        zoom: 16
      });
    } else if (validVehicles.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      validVehicles.forEach(vehicle => {
        bounds.extend([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [vehicles, isMapLoaded, selectedVehicle]);

  // Focus on selected vehicle
  useEffect(() => {
    if (selectedVehicle && map.current && isMapLoaded && selectedVehicle.lastPosition) {
      map.current.flyTo({
        center: [selectedVehicle.lastPosition.lon, selectedVehicle.lastPosition.lat],
        zoom: 16,
        duration: 1000
      });
    }
  }, [selectedVehicle, isMapLoaded]);

  const handleZoomIn = () => {
    map.current?.zoomIn();
  };

  const handleZoomOut = () => {
    map.current?.zoomOut();
  };

  const handleResetView = () => {
    if (vehicles.length > 0) {
      const validVehicles = vehicles.filter(v => v.lastPosition?.lat && v.lastPosition?.lon);
      if (validVehicles.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        validVehicles.forEach(vehicle => {
          bounds.extend([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat]);
        });
        map.current?.fitBounds(bounds, { padding: 50 });
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Enhanced Fleet Map
            <Badge variant="outline" className="ml-2">
              {vehicles.length} vehicles
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div 
            ref={mapContainer} 
            className="w-full rounded-lg overflow-hidden"
            style={{ height }}
          />
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-pulse" />
                <p className="text-sm text-muted-foreground">Loading enhanced map...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Map Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Offline</span>
          </div>
          {clusteredVehicles.some(v => (v as any).isCluster) && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Vehicle cluster</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedTrackingMap;
