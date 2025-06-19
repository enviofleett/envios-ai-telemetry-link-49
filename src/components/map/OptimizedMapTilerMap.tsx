
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { VehicleData } from '@/types/vehicle';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import { mapVirtualizationService, type ViewportBounds } from '@/services/map/mapVirtualizationService';
import { trailOptimizationService } from '@/services/map/trailOptimizationService';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';

interface OptimizedMapTilerMapProps {
  vehicles: VehicleData[];
  height?: string;
  onVehicleSelect?: (vehicle: VehicleData) => void;
  selectedVehicle?: VehicleData | null;
  defaultZoom?: number;
  showControls?: boolean;
  showTrails?: boolean;
  vehicleTrails?: Map<string, any[]>;
  enableClustering?: boolean;
  maxVehiclesPerView?: number;
}

const OptimizedMapTilerMap: React.FC<OptimizedMapTilerMapProps> = ({
  vehicles,
  height = '400px',
  onVehicleSelect,
  selectedVehicle,
  defaultZoom = 10,
  showControls = true,
  showTrails = false,
  vehicleTrails = new Map(),
  enableClustering = true,
  maxVehiclesPerView = 200
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [renderStats, setRenderStats] = useState({
    visibleVehicles: 0,
    clusters: 0,
    renderLevel: 'individual' as const
  });

  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const clustersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const trailsRef = useRef<Map<string, maplibregl.LngLatBounds>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const styleUrl = mapTilerService.getMapStyle();

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [0, 0],
      zoom: 2,
      transformRequest: (async (url: string, resourceType?: maplibregl.ResourceType) => {
        if (url.startsWith(SUPABASE_URL)) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            return {
              url: url,
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            };
          }
        }
        return { url };
      }) as unknown as maplibregl.RequestTransformFunction,
    });

    if (showControls) {
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    }

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    // Set up viewport change handlers for virtualization
    map.current.on('moveend', handleViewportChange);
    map.current.on('zoomend', handleViewportChange);

    return () => {
      map.current?.remove();
    };
  }, [showControls]);

  // Update virtualization service with vehicle data
  useEffect(() => {
    mapVirtualizationService.setVehicleData(vehicles);
  }, [vehicles]);

  const handleViewportChange = useCallback(() => {
    if (!map.current || !isMapLoaded) return;

    const bounds = map.current.getBounds();
    const zoom = map.current.getZoom();

    const viewport: ViewportBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };

    const virtualizedData = mapVirtualizationService.virtualizeForViewport(viewport, zoom, {
      enableClustering,
      maxVehiclesPerView
    });

    updateMapWithVirtualizedData(virtualizedData);
    
    setRenderStats({
      visibleVehicles: virtualizedData.visibleVehicles.length,
      clusters: virtualizedData.clusters.length,
      renderLevel: virtualizedData.renderLevel
    });
  }, [isMapLoaded, enableClustering, maxVehiclesPerView]);

  const updateMapWithVirtualizedData = useCallback((data: any) => {
    if (!map.current) return;

    // Clear existing markers and clusters
    clearMapElements();

    switch (data.renderLevel) {
      case 'individual':
        renderIndividualMarkers(data.visibleVehicles);
        break;
      case 'clustered':
        renderClusters(data.clusters);
        break;
      case 'heatmap':
        renderHeatmap(data.visibleVehicles);
        break;
    }

    // Render trails if enabled
    if (showTrails) {
      renderOptimizedTrails();
    }
  }, [showTrails]);

  const renderIndividualMarkers = useCallback((vehicleList: VehicleData[]) => {
    for (const vehicle of vehicleList) {
      if (!vehicle.last_position) continue;

      const element = createVehicleMarkerElement(vehicle);
      const marker = new maplibregl.Marker(element)
        .setLngLat([vehicle.last_position.longitude, vehicle.last_position.latitude])
        .addTo(map.current!);

      markersRef.current.set(vehicle.device_id, marker);
    }
  }, []);

  const renderClusters = useCallback((clusters: any[]) => {
    for (const cluster of clusters) {
      const element = createClusterMarkerElement(cluster);
      const marker = new maplibregl.Marker(element)
        .setLngLat([cluster.lng, cluster.lat])
        .addTo(map.current!);

      clustersRef.current.set(`cluster-${cluster.lat}-${cluster.lng}`, marker);
    }
  }, []);

  const renderHeatmap = useCallback((vehicleList: VehicleData[]) => {
    // For heatmap rendering, we'd typically use WebGL layers
    // For now, render as small dots
    for (const vehicle of vehicleList) {
      if (!vehicle.last_position) continue;

      const element = createHeatmapPointElement();
      const marker = new maplibregl.Marker(element)
        .setLngLat([vehicle.last_position.longitude, vehicle.last_position.latitude])
        .addTo(map.current!);

      markersRef.current.set(vehicle.device_id, marker);
    }
  }, []);

  const renderOptimizedTrails = useCallback(() => {
    if (!map.current) return;

    const zoom = map.current.getZoom();

    vehicleTrails.forEach((trail, deviceId) => {
      if (trail.length < 2) return;

      const trailPoints = trail.map(point => ({
        lat: point.lat,
        lng: point.lng,
        timestamp: new Date(point.timestamp).getTime(),
        speed: point.speed
      }));

      const optimizedTrail = trailOptimizationService.optimizeTrail(trailPoints, zoom);

      if (optimizedTrail.points.length >= 2) {
        const coordinates = optimizedTrail.points.map(p => [p.lng, p.lat]);
        
        // Add trail as a line layer
        const sourceId = `trail-${deviceId}`;
        const layerId = `trail-layer-${deviceId}`;

        if (map.current!.getSource(sourceId)) {
          (map.current!.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates
            }
          });
        } else {
          map.current!.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates
              }
            }
          });

          map.current!.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 2,
              'line-opacity': 0.7
            }
          });
        }
      }
    });
  }, [vehicleTrails]);

  const createVehicleMarkerElement = (vehicle: VehicleData) => {
    const element = document.createElement('div');
    element.className = 'vehicle-marker';
    element.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${vehicle.isOnline ? '#10b981' : '#ef4444'};
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      cursor: pointer;
      transition: transform 0.2s;
    `;

    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.2)';
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
    });

    element.addEventListener('click', () => {
      onVehicleSelect?.(vehicle);
    });

    return element;
  };

  const createClusterMarkerElement = (cluster: any) => {
    const element = document.createElement('div');
    element.className = 'cluster-marker';
    element.style.cssText = `
      width: ${Math.min(40 + cluster.count * 2, 60)}px;
      height: ${Math.min(40 + cluster.count * 2, 60)}px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      cursor: pointer;
    `;

    element.textContent = cluster.count.toString();

    element.addEventListener('click', () => {
      if (map.current) {
        map.current.fitBounds([
          [cluster.bounds.west, cluster.bounds.south],
          [cluster.bounds.east, cluster.bounds.north]
        ], { padding: 50 });
      }
    });

    return element;
  };

  const createHeatmapPointElement = () => {
    const element = document.createElement('div');
    element.style.cssText = `
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.6);
    `;
    return element;
  };

  const clearMapElements = useCallback(() => {
    // Clear markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Clear clusters
    clustersRef.current.forEach(marker => marker.remove());
    clustersRef.current.clear();

    // Clear trail layers
    if (map.current) {
      trailsRef.current.forEach((_, deviceId) => {
        const layerId = `trail-layer-${deviceId}`;
        const sourceId = `trail-${deviceId}`;
        
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId);
        }
      });
      trailsRef.current.clear();
    }
  }, []);

  // Trigger initial viewport change when map loads
  useEffect(() => {
    if (isMapLoaded) {
      handleViewportChange();
    }
  }, [isMapLoaded, handleViewportChange]);

  // Filter vehicles with valid positions
  const validVehicles = useMemo(() => 
    vehicles.filter(v => 
      v.last_position?.latitude && 
      v.last_position?.longitude &&
      !isNaN(v.last_position.latitude) &&
      !isNaN(v.last_position.longitude)
    ), [vehicles]
  );

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Performance Stats Overlay */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm text-xs">
        <div>Mode: {renderStats.renderLevel}</div>
        <div>Visible: {renderStats.visibleVehicles}</div>
        {renderStats.clusters > 0 && <div>Clusters: {renderStats.clusters}</div>}
        <div>Total: {validVehicles.length}</div>
      </div>

      {/* No data overlay */}
      {validVehicles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicle Locations</h3>
            <p className="text-gray-500">No vehicles with valid GPS coordinates</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedMapTilerMap;
