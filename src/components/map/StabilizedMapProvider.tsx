
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapProvider, Vehicle, MapProviderOptions } from '@/types/mapProviders';
import { MapProviderFactory } from '@/services/mapProviders/MapProviderFactory';
import { useEnhancedMapApi } from '@/hooks/useEnhancedMapApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface StabilizedMapProviderProps {
  vehicles?: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  enableClustering?: boolean;
  className?: string;
  onMapReady?: (provider: MapProvider) => void;
}

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">Map rendering error</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => this.setState({ hasError: false })}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const StabilizedMapProvider: React.FC<StabilizedMapProviderProps> = ({
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
  const [mapError, setMapError] = useState<Error | null>(null);
  
  const initAttemptCount = useRef(0);
  const lastVehicleUpdate = useRef<string>('');

  const {
    currentProvider,
    isLoading,
    error: providerError,
    healthStatus,
    refetch,
    performHealthCheck,
    switchToFallbackProvider
  } = useEnhancedMapApi();

  // Memoize vehicle data to prevent unnecessary updates
  const vehicleFingerprint = useMemo(() => {
    return vehicles.map(v => 
      `${v.deviceid}-${v.lastPosition?.lat}-${v.lastPosition?.lon}-${v.lastPosition?.updatetime}`
    ).join('|');
  }, [vehicles]);

  const initializeMap = useCallback(async () => {
    if (!currentProvider || !mapContainer.current || isInitializing) return;
    
    // Prevent excessive initialization attempts
    if (initAttemptCount.current > 3) {
      setInitializationError('Max initialization attempts exceeded');
      return;
    }

    try {
      setIsInitializing(true);
      setInitializationError(null);
      initAttemptCount.current++;

      console.log(`🗺️ Initializing ${currentProvider.provider_type} provider (attempt ${initAttemptCount.current})...`);

      // Clean up existing provider
      if (mapProvider) {
        try {
          mapProvider.destroy();
        } catch (error) {
          console.warn('Error destroying previous map provider:', error);
        }
        setMapProvider(null);
      }

      // Create new provider with timeout
      const provider = MapProviderFactory.create(currentProvider.provider_type as any);
      
      const options: MapProviderOptions = {
        center,
        zoom,
        enableClustering,
        interactive: true
      };

      // Initialize with timeout
      const initPromise = provider.initialize(currentProvider.api_key, mapContainer.current, options);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Map initialization timeout')), 15000)
      );

      await Promise.race([initPromise, timeoutPromise]);
      
      setMapProvider(provider);
      onMapReady?.(provider);
      initAttemptCount.current = 0; // Reset on success

      console.log(`✅ ${provider.getProviderName()} map initialized successfully`);

    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setInitializationError(errorMessage);

      // Try fallback after multiple failures
      if (initAttemptCount.current >= 2 && currentProvider) {
        try {
          await switchToFallbackProvider(currentProvider.id, `Initialization failed: ${errorMessage}`);
        } catch (fallbackError) {
          console.error('Fallback provider switch failed:', fallbackError);
        }
      }
    } finally {
      setIsInitializing(false);
    }
  }, [currentProvider, center, zoom, enableClustering, onMapReady, mapProvider, switchToFallbackProvider, isInitializing]);

  // Initialize map when provider changes
  useEffect(() => {
    if (currentProvider && mapContainer.current) {
      initializeMap();
    }
  }, [currentProvider?.id]); // Only depend on provider ID to prevent loops

  // Update vehicles only when fingerprint changes
  useEffect(() => {
    if (mapProvider && vehicles.length > 0 && vehicleFingerprint !== lastVehicleUpdate.current) {
      try {
        mapProvider.addVehicleMarkers(vehicles);
        lastVehicleUpdate.current = vehicleFingerprint;
      } catch (error) {
        console.error('Error updating vehicle markers:', error);
      }
    }
  }, [mapProvider, vehicleFingerprint, vehicles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapProvider) {
        try {
          mapProvider.destroy();
        } catch (error) {
          console.warn('Error during map cleanup:', error);
        }
      }
    };
  }, []);

  const handleRetry = useCallback(() => {
    initAttemptCount.current = 0;
    setMapError(null);
    setInitializationError(null);
    refetch();
  }, [refetch]);

  const handleMapError = useCallback((error: Error) => {
    console.error('Map component error:', error);
    setMapError(error);
  }, []);

  const handleHealthCheck = useCallback(async () => {
    if (currentProvider) {
      await performHealthCheck(currentProvider);
    }
  }, [currentProvider, performHealthCheck]);

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

  if (providerError || initializationError || mapError) {
    const errorMessage = providerError || initializationError || mapError?.message;
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <Alert className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Map Error:</strong> {errorMessage}</p>
              <div className="flex gap-2">
                <Button onClick={handleRetry} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                {currentProvider && (
                  <Button onClick={handleHealthCheck} size="sm" variant="outline">
                    Check Health
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapErrorBoundary onError={handleMapError}>
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
        {vehicles.length > 0 && mapProvider && !isInitializing && (
          <div className="absolute bottom-4 left-4 z-10">
            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
              {vehicles.length} vehicles
            </Badge>
          </div>
        )}
      </MapErrorBoundary>
    </div>
  );
};

export default StabilizedMapProvider;
