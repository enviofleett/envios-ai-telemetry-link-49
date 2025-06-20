
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mapVirtualizationService } from '@/services/map/mapVirtualizationService';
import { markerClusteringService } from '@/services/map/markerClusteringService';
import { trailOptimizationService } from '@/services/map/trailOptimizationService';
import { MapPerformanceMonitor } from './MapPerformanceMonitor';
import type { VehicleData } from '@/types/vehicle';
import { Map as MapIcon, ZoomIn, ZoomOut, Layers, Settings } from 'lucide-react';

// Define the render level type
type RenderLevel = 'individual' | 'clustered' | 'heatmap';

interface OptimizedMapTilerMapProps {
  vehicles: VehicleData[];
  selectedVehicle?: VehicleData | null;
  onVehicleSelect?: (vehicle: VehicleData) => void;
  showTrails?: boolean;
  vehicleTrails?: Map<string, any[]>;
  enableClustering?: boolean;
  maxVehiclesPerView?: number;
  height?: string;
  showControls?: boolean;
}

interface MapStats {
  totalVehicles: number;
  visibleVehicles: number;
  clusters: number;
  renderLevel: RenderLevel;
  loadTime: number;
}

const OptimizedMapTilerMap: React.FC<OptimizedMapTilerMapProps> = ({
  vehicles = [],
  selectedVehicle,
  onVehicleSelect,
  showTrails = true,
  vehicleTrails = new Map<string, any[]>(),
  enableClustering = true,
  maxVehiclesPerView = 200,
  height = '400px',
  showControls = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapStats, setMapStats] = useState<MapStats>({
    totalVehicles: 0,
    visibleVehicles: 0,
    clusters: 0,
    renderLevel: 'individual',
    loadTime: 0
  });

  const [viewport, setViewport] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 10
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // Set vehicle data in virtualization service
  useEffect(() => {
    mapVirtualizationService.setVehicleData(vehicles);
  }, [vehicles]);

  // Calculate viewport bounds from current view
  const viewportBounds = useMemo(() => {
    const latOffset = 0.01 * Math.pow(2, 10 - viewport.zoom);
    const lngOffset = 0.01 * Math.pow(2, 10 - viewport.zoom);
    
    return {
      north: viewport.latitude + latOffset,
      south: viewport.latitude - latOffset,
      east: viewport.longitude + lngOffset,
      west: viewport.longitude - lngOffset
    };
  }, [viewport]);

  // Get virtualized map data
  const virtualizedData = useMemo(() => {
    const startTime = performance.now();
    
    const data = mapVirtualizationService.virtualizeForViewport(
      viewportBounds,
      viewport.zoom,
      {
        enableClustering,
        maxVehiclesPerView,
        bufferFactor: 1.5,
        updateThrottle: 250
      }
    );

    const loadTime = performance.now() - startTime;
    
    // Update stats
    setMapStats(prev => ({
      ...prev,
      totalVehicles: data.totalVehicles,
      visibleVehicles: data.visibleVehicles.length,
      clusters: data.clusters.length,
      renderLevel: data.renderLevel,
      loadTime: Math.round(loadTime)
    }));

    return data;
  }, [viewportBounds, viewport.zoom, enableClustering, maxVehiclesPerView]);

  // Optimize trails for visible vehicles
  const optimizedTrails = useMemo(() => {
    if (!showTrails || !vehicleTrails.size) return new Map<string, any>();
    
    const optimized = new Map<string, any>();
    
    virtualizedData.visibleVehicles.forEach(vehicle => {
      const trail = vehicleTrails.get(vehicle.device_id);
      if (trail && trail.length > 0) {
        const optimizedTrail = trailOptimizationService.optimizeTrail(
          trail,
          viewport.zoom,
          {
            tolerance: 0.0001,
            maxPoints: 200,
            minTimeGap: 30,
            preserveShape: true
          }
        );
        optimized.set(vehicle.device_id, optimizedTrail);
      }
    });

    return optimized;
  }, [virtualizedData.visibleVehicles, vehicleTrails, viewport.zoom, showTrails]);

  const handleZoomIn = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 1, 18)
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 1, 1)
    }));
  }, []);

  const handleViewportChange = useCallback((newViewport: any) => {
    setViewport(newViewport);
  }, []);

  // Simulate map initialization
  useEffect(() => {
    if (!mapRef.current) return;

    setIsLoading(true);
    
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Set initial viewport based on vehicles
      if (vehicles.length > 0) {
        const firstVehicle = vehicles.find(v => v.last_position);
        if (firstVehicle?.last_position) {
          setViewport(prev => ({
            ...prev,
            latitude: firstVehicle.last_position!.latitude,
            longitude: firstVehicle.last_position!.longitude
          }));
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [vehicles]);

  const renderModeColor = {
    individual: 'bg-green-500',
    clustered: 'bg-blue-500',
    heatmap: 'bg-orange-500'
  };

  const renderModeLabel = {
    individual: 'Individual',
    clustered: 'Clustered',
    heatmap: 'Heatmap'
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <Card className="h-full">
        <CardContent className="p-0 h-full relative">
          {/* Map Container */}
          <div 
            ref={mapRef}
            className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center"
          >
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading optimized map...</p>
              </div>
            ) : (
              <div className="text-center">
                <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Map placeholder - {virtualizedData.visibleVehicles.length} vehicles visible
                </p>
                <p className="text-xs text-gray-500">
                  Render mode: {renderModeLabel[virtualizedData.renderLevel]}
                </p>
              </div>
            )}
          </div>

          {/* Map Controls */}
          {showControls && !isLoading && (
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="bg-white/90 backdrop-blur-sm"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="bg-white/90 backdrop-blur-sm"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
                className="bg-white/90 backdrop-blur-sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Stats Overlay */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`${renderModeColor[virtualizedData.renderLevel]} text-white`}
              >
                {renderModeLabel[virtualizedData.renderLevel]}
              </Badge>
              <span>Zoom: {viewport.zoom}</span>
            </div>
            <div>Vehicles: {mapStats.visibleVehicles}/{mapStats.totalVehicles}</div>
            {mapStats.clusters > 0 && <div>Clusters: {mapStats.clusters}</div>}
            <div>Load: {mapStats.loadTime}ms</div>
            {optimizedTrails.size > 0 && <div>Trails: {optimizedTrails.size}</div>}
          </div>

          {/* Performance Monitor */}
          {showPerformanceMonitor && <MapPerformanceMonitor />}
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedMapTilerMap;
