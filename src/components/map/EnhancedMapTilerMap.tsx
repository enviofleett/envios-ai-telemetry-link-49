
import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapTilerApi } from '@/hooks/useMapTilerApi';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { mapAnalyticsService } from '@/services/mapAnalytics';
import { geofencingService, type Geofence } from '@/services/geofencing';

interface Vehicle {
  deviceid: string;
  devicename: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed?: number;
    course?: number;
    updatetime: string;
    statusText?: string;
  };
  status?: string;
}

interface EnhancedMapTilerMapProps {
  vehicles?: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  enableClustering?: boolean;
  enableGeofencing?: boolean;
  maxVehiclesBeforeClustering?: number;
}

const EnhancedMapTilerMap: React.FC<EnhancedMapTilerMapProps> = ({
  vehicles = [],
  onVehicleSelect,
  center = [0, 0],
  zoom = 2,
  height = '500px',
  className = '',
  enableClustering = true,
  enableGeofencing = false,
  maxVehiclesBeforeClustering = 100
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const geofenceLayer = useRef<string | null>(null);
  const { apiKey, isLoading, error } = useMapTilerApi();
  const [mapError, setMapError] = useState<string | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const sessionId = mapAnalyticsService.getSessionId();
  const startTime = useRef<number>(Date.now());

  // Load geofences
  useEffect(() => {
    if (enableGeofencing) {
      loadGeofences();
    }
  }, [enableGeofencing]);

  const loadGeofences = async () => {
    try {
      const fetchedGeofences = await geofencingService.getGeofences();
      setGeofences(fetchedGeofences);
    } catch (error) {
      console.error('Failed to load geofences:', error);
    }
  };

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getMarkerColor = (vehicle: Vehicle) => {
    const status = getVehicleStatus(vehicle);
    switch (status) {
      case 'online': return '#10B981';
      case 'idle': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const trackMapEvent = useCallback(async (actionType: string, additionalData?: any) => {
    if (!map.current) return;

    const center = map.current.getCenter();
    const bounds = map.current.getBounds();

    await mapAnalyticsService.trackEvent({
      session_id: sessionId,
      action_type: actionType as any,
      action_data: additionalData,
      zoom_level: Math.round(map.current.getZoom()),
      center_lat: center.lat,
      center_lng: center.lng,
      viewport_bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      }
    });
  }, [sessionId]);

  const trackPerformanceMetric = useCallback(async (metricType: string, value: number, metadata?: any) => {
    await mapAnalyticsService.trackPerformance({
      session_id: sessionId,
      metric_type: metricType as any,
      metric_value: value,
      metadata
    });
  }, [sessionId]);

  // Initialize map
  useEffect(() => {
    if (!apiKey || !mapContainer.current || map.current) return;

    const loadStart = Date.now();

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
        center: center,
        zoom: zoom,
        attributionControl: true
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Track map events
      map.current.on('zoom', () => trackMapEvent('zoom'));
      map.current.on('drag', () => trackMapEvent('pan'));

      map.current.on('error', (e) => {
        console.error('MapTiler error:', e);
        setMapError('Failed to load map');
        trackPerformanceMetric('error', 1, { error: e.error?.message });
      });

      map.current.on('load', () => {
        const loadTime = Date.now() - loadStart;
        setIsMapLoaded(true);
        trackPerformanceMetric('load_time', loadTime);
        trackMapEvent('load');
        console.log('Enhanced MapTiler map loaded successfully');
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setMapError('Failed to initialize map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapLoaded(false);
      }
    };
  }, [apiKey, center, zoom, trackMapEvent, trackPerformanceMetric]);

  // Add clustering source and layer
  useEffect(() => {
    if (!map.current || !isMapLoaded || !enableClustering) return;

    const vehiclesWithPosition = vehicles.filter(v => v.lastPosition?.lat && v.lastPosition?.lon);
    
    if (vehiclesWithPosition.length < maxVehiclesBeforeClustering) {
      return; // Use regular markers for small datasets
    }

    const geoJsonData = {
      type: 'FeatureCollection' as const,
      features: vehiclesWithPosition.map(vehicle => ({
        type: 'Feature' as const,
        properties: {
          deviceid: vehicle.deviceid,
          devicename: vehicle.devicename,
          status: getVehicleStatus(vehicle),
          color: getMarkerColor(vehicle)
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [vehicle.lastPosition!.lon, vehicle.lastPosition!.lat]
        }
      }))
    };

    if (map.current.getSource('vehicles')) {
      (map.current.getSource('vehicles') as mapboxgl.GeoJSONSource).setData(geoJsonData);
    } else {
      map.current.addSource('vehicles', {
        type: 'geojson',
        data: geoJsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Add cluster circles
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'vehicles',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100, '#f1f075',
            750, '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, 100, 30, 750, 40
          ]
        }
      });

      // Add cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'vehicles',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // Add unclustered points
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'vehicles',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Handle cluster clicks
      map.current.on('click', 'clusters', (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties!.cluster_id;
        
        (map.current!.getSource('vehicles') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            
            map.current!.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom: zoom
            });
            
            trackMapEvent('cluster_expand', { clusterId, zoom });
          }
        );
      });

      // Handle unclustered point clicks
      map.current.on('click', 'unclustered-point', (e) => {
        const feature = e.features![0];
        const deviceId = feature.properties!.deviceid;
        const vehicle = vehicles.find(v => v.deviceid === deviceId);
        
        if (vehicle && onVehicleSelect) {
          onVehicleSelect(vehicle);
          trackMapEvent('marker_click', { deviceId, deviceName: vehicle.devicename });
        }
      });
    }

    trackPerformanceMetric('marker_count', vehiclesWithPosition.length, { clustering: true });

  }, [vehicles, isMapLoaded, enableClustering, maxVehiclesBeforeClustering, onVehicleSelect, trackMapEvent, trackPerformanceMetric]);

  // Add geofences to map
  useEffect(() => {
    if (!map.current || !isMapLoaded || !enableGeofencing || geofences.length === 0) return;

    const geofenceData = {
      type: 'FeatureCollection' as const,
      features: geofences.map(geofence => ({
        type: 'Feature' as const,
        properties: {
          id: geofence.id,
          name: geofence.name,
          fence_type: geofence.fence_type
        },
        geometry: geofence.geometry
      }))
    };

    if (map.current.getSource('geofences')) {
      (map.current.getSource('geofences') as mapboxgl.GeoJSONSource).setData(geofenceData);
    } else {
      map.current.addSource('geofences', {
        type: 'geojson',
        data: geofenceData
      });

      map.current.addLayer({
        id: 'geofence-fills',
        type: 'fill',
        source: 'geofences',
        paint: {
          'fill-color': [
            'match',
            ['get', 'fence_type'],
            'inclusion', '#10B981',
            'exclusion', '#EF4444',
            '#6B7280'
          ],
          'fill-opacity': 0.2
        }
      });

      map.current.addLayer({
        id: 'geofence-borders',
        type: 'line',
        source: 'geofences',
        paint: {
          'line-color': [
            'match',
            ['get', 'fence_type'],
            'inclusion', '#10B981',
            'exclusion', '#EF4444',
            '#6B7280'
          ],
          'line-width': 2
        }
      });

      geofenceLayer.current = 'geofences';
    }
  }, [geofences, isMapLoaded, enableGeofencing]);

  // Regular markers for small datasets or when clustering is disabled
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const vehiclesWithPosition = vehicles.filter(v => v.lastPosition?.lat && v.lastPosition?.lon);
    
    // Only use regular markers if clustering is disabled or dataset is small
    if (enableClustering && vehiclesWithPosition.length >= maxVehiclesBeforeClustering) {
      return;
    }

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    vehiclesWithPosition.forEach(vehicle => {
      const markerColor = getMarkerColor(vehicle);

      const markerElement = document.createElement('div');
      markerElement.className = 'custom-vehicle-marker';
      markerElement.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${markerColor};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        transition: all 0.2s ease;
      `;

      markerElement.textContent = vehicle.devicename.substring(0, 2).toUpperCase();

      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat])
        .addTo(map.current!);

      // Add popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-3 min-w-[250px]">
            <h3 class="font-semibold text-base">${vehicle.devicename}</h3>
            <div class="text-sm text-gray-600 mt-2">
              <div><strong>Status:</strong> ${getVehicleStatus(vehicle)}</div>
              <div><strong>Speed:</strong> ${vehicle.lastPosition?.speed || 0} km/h</div>
            </div>
          </div>
        `);

      marker.setPopup(popup);

      markerElement.addEventListener('click', () => {
        if (onVehicleSelect) {
          onVehicleSelect(vehicle);
          trackMapEvent('marker_click', { deviceId: vehicle.deviceid });
        }
      });

      markers.current.push(marker);
    });

    trackPerformanceMetric('marker_count', vehiclesWithPosition.length, { clustering: false });

    // Fit map to markers
    if (vehiclesWithPosition.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      vehiclesWithPosition.forEach(vehicle => {
        bounds.extend([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat]);
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    }
  }, [vehicles, isMapLoaded, enableClustering, maxVehiclesBeforeClustering, onVehicleSelect, trackMapEvent, trackPerformanceMetric]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <LoadingSpinner />
              <p className="text-sm text-gray-600 mt-2">Loading enhanced map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || mapError) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error || mapError}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          className="w-full rounded-lg" 
          style={{ height }}
        />
      </CardContent>
    </Card>
  );
};

export default EnhancedMapTilerMap;
