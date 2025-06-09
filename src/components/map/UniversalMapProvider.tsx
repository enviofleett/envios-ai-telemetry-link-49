
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapProvider, Vehicle, MapProviderOptions } from '@/types/mapProviders';
import { MapProviderFactory } from '@/services/mapProviders/MapProviderFactory';
import { useEnhancedMapApi } from '@/hooks/useEnhancedMapApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface UniversalMapProviderProps {
  vehicles?: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  enableClustering?: boolean;
  className?: string;
  onMapReady?: (provider: MapProvider) => void;
}

const UniversalMapProvider: React.FC<UniversalMapProviderProps> = ({
  vehicles = [],
  onVehicleSelect,
  center = [0, 0],
  zoom = 2,
  height = '400px',
  enableClustering = true,
  className = '',
  onMapReady
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapProvider, setMapProvider] = useState<MapProvider | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const {
    currentProvider,
    isLoading,
    error: providerError,
    healthStatus,
    refetch,
    performHealthCheck,
    switchToFallbackProvider
  } = useEnhancedMapApi();

  const initializeMap = useCallback(async () => {
    if (!currentProvider || !mapContainer.current || isInitializing) return;

    try {
      setIsInitializing(true);
      setInitializationError(null);

      // Clean up existing provider
      if (mapProvider) {
        mapProvider.destroy();
        setMapProvider(null);
      }

      console.log(`🗺️ Initializing ${currentProvider.provider_type} provider...`);

      // Create new provider
      const provider = MapProviderFactory.create(currentProvider.provider_type as any);
      
      const options: MapProviderOptions = {
        center,
        zoom,
        enableClustering,
        interactive: true
      };

      // Initialize the provider
      await provider.initialize(currentProvider.api_key, mapContainer.current, options);
      
      // Add vehicles if any
      if (vehicles.length > 0) {
        provider.addVehicleMarkers(vehicles);
      }

      setMapProvider(provider);
      onMapReady?.(provider);

      console.log(`✅ ${provider.getProviderName()} map initialized successfully`);

    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setInitializationError(errorMessage);

      // Try to switch to fallback provider
      if (currentProvider) {
        try {
          await switchToFallbackProvider(currentProvider.id, `Initialization failed: ${errorMessage}`);
        } catch (fallbackError) {
          console.error('Fallback provider switch failed:', fallbackError);
        }
      }
    } finally {
      setIsInitializing(false);
    }
  }, [currentProvider, center, zoom, enableClustering, vehicles, onMapReady, mapProvider, switchToFallbackProvider, isInitializing]);

  // Initialize map when provider changes
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update vehicles when they change
  useEffect(() => {
    if (mapProvider && vehicles.length > 0) {
      mapProvider.addVehicleMarkers(vehicles);
    }
  }, [mapProvider, vehicles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapProvider) {
        mapProvider.destroy();
      }
    };
  }, [mapProvider]);

  const handleRetry = () => {
    refetch();
  };

  const handleHealthCheck = async () => {
    if (currentProvider) {
      await performHealthCheck(currentProvider);
    }
  };

  const getStatusBadge = () => {
    if (isLoading || isInitializing) {
      return <Badge variant="secondary">Loading...</Badge>;
    }
    
    switch (healthStatus) {
      case 'healthy':
        return (
          <Badge className="bg-green-500 text-white">
            <Wifi className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-yellow-500 text-white">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Degraded
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500 text-white">
            <WifiOff className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <LoadingSpinner />
          <span className="ml-2">Loading map configuration...</span>
        </div>
      </div>
    );
  }

  if (providerError || initializationError) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <Alert className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Map Error:</strong> {providerError || initializationError}</p>
              <Button onClick={handleRetry} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ height }}
      />
      
      {/* Status Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {getStatusBadge()}
        {currentProvider && (
          <Badge variant="outline">
            {currentProvider.name} ({currentProvider.provider_type})
          </Badge>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          onClick={handleHealthCheck}
          size="sm"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm"
          disabled={!currentProvider}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
          <div className="flex items-center gap-2">
            <LoadingSpinner />
            <span>Initializing {currentProvider?.provider_type} map...</span>
          </div>
        </div>
      )}

      {/* Vehicle Count */}
      {vehicles.length > 0 && mapProvider && (
        <div className="absolute bottom-4 left-4 z-10">
          <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
            {vehicles.length} vehicles
          </Badge>
        </div>
      )}
    </div>
  );
};

export default UniversalMapProvider;
