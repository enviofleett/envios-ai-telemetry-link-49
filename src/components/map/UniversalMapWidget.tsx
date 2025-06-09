
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Maximize2, Minimize2, RefreshCw, Settings } from 'lucide-react';
import StabilizedMapProvider from './StabilizedMapProvider';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface UniversalMapWidgetProps {
  title?: string;
  height?: string;
  enableFullscreen?: boolean;
  enableControls?: boolean;
  enableClustering?: boolean;
  showVehicleCount?: boolean;
  showStatusSummary?: boolean;
  filters?: {
    search?: string;
    status?: 'all' | 'online' | 'offline' | 'alerts';
    user?: string;
  };
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  className?: string;
}

const UniversalMapWidget: React.FC<UniversalMapWidgetProps> = ({
  title = "Fleet Map",
  height = "400px",
  enableFullscreen = true,
  enableControls = true,
  enableClustering = true,
  showVehicleCount = true,
  showStatusSummary = true,
  filters,
  onVehicleSelect,
  onFullscreenToggle,
  className = ""
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { vehicles, allVehicles, isLoading, forceRefresh } = useStableVehicleData(filters);

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const statusCounts = allVehicles.reduce((acc, vehicle) => {
    const status = getVehicleStatus(vehicle);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFullscreenToggle = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    onFullscreenToggle?.(newFullscreenState);
  };

  const effectiveHeight = isFullscreen ? "80vh" : height;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            {title}
            {showVehicleCount && (
              <Badge variant="outline" className="ml-2">
                {vehicles.length} trackable
              </Badge>
            )}
          </CardTitle>
          
          {enableControls && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              {enableFullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFullscreenToggle}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {showStatusSummary && (
          <div className="flex flex-wrap gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Online: {statusCounts.online || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Idle: {statusCounts.idle || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm">Offline: {statusCounts.offline || 0}</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium">
                Coverage: {allVehicles.length > 0 ? 
                  ((vehicles.length / allVehicles.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <StabilizedMapProvider
          vehicles={vehicles}
          onVehicleSelect={onVehicleSelect}
          height={effectiveHeight}
          enableClustering={enableClustering}
          className="rounded-b-lg border-0"
        />
      </CardContent>
    </Card>
  );
};

export default UniversalMapWidget;
