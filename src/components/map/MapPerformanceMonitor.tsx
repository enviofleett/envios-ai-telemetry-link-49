
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mapVirtualizationService } from '@/services/map/mapVirtualizationService';
import { trailOptimizationService } from '@/services/map/trailOptimizationService';
import { Activity, Gauge, Map, Zap } from 'lucide-react';

interface PerformanceMetrics {
  totalVehicles: number;
  cacheSize: number;
  memoryUsage: number;
  renderMode: string;
  trailCacheSize: number;
  frameRate: number;
  loadTime: number;
}

export const MapPerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalVehicles: 0,
    cacheSize: 0,
    memoryUsage: 0,
    renderMode: 'individual',
    trailCacheSize: 0,
    frameRate: 60,
    loadTime: 0
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const virtualizationStats = mapVirtualizationService.getPerformanceStats();
      const trailStats = trailOptimizationService.getCacheStats();

      setMetrics({
        totalVehicles: virtualizationStats.totalVehicles,
        cacheSize: virtualizationStats.cacheSize,
        memoryUsage: virtualizationStats.memoryUsage,
        renderMode: 'optimized', // This would come from current render state
        trailCacheSize: trailStats.cacheSize,
        frameRate: Math.round(60 - Math.random() * 10), // Simulated for demo
        loadTime: Math.round(Math.random() * 100) // Simulated for demo
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  const clearAllCaches = () => {
    mapVirtualizationService.clearCache();
    trailOptimizationService.clearCache();
    setMetrics(prev => ({ ...prev, cacheSize: 0, trailCacheSize: 0, memoryUsage: 0 }));
  };

  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return 'bg-green-500';
    if (value < thresholds[1]) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="bg-white/90 backdrop-blur-sm"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance: {metrics.frameRate}fps
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Map Performance
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Rendering Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Map className="h-3 w-3 text-blue-500" />
              <span>Vehicles: {metrics.totalVehicles}</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-3 w-3 text-green-500" />
              <span>FPS: {metrics.frameRate}</span>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Frame Rate</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getPerformanceColor(metrics.frameRate, [45, 30])}`} />
                <span>{metrics.frameRate} fps</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span>Memory Usage</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getPerformanceColor(metrics.memoryUsage, [1000000, 5000000])}`} />
                <span>{formatBytes(metrics.memoryUsage)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span>Load Time</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getPerformanceColor(metrics.loadTime, [100, 500])}`} />
                <span>{metrics.loadTime}ms</span>
              </div>
            </div>
          </div>

          {/* Cache Information */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Viewport Cache</span>
              <Badge variant="outline" className="text-xs">
                {metrics.cacheSize} entries
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span>Trail Cache</span>
              <Badge variant="outline" className="text-xs">
                {metrics.trailCacheSize} entries
              </Badge>
            </div>
          </div>

          {/* Optimization Status */}
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 text-xs mb-2">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>Optimizations Active</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">Clustering</Badge>
              <Badge variant="secondary" className="text-xs">Virtualization</Badge>
              <Badge variant="secondary" className="text-xs">Trail Simplification</Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllCaches}
              className="w-full text-xs"
            >
              Clear All Caches
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapPerformanceMonitor;
