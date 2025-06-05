
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Gauge, 
  Search,
  RefreshCw,
  Car,
  Activity,
  Filter
} from 'lucide-react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import LiveTrackingFilters from '@/components/tracking/LiveTrackingFilters';
import LiveVehicleCard from '@/components/tracking/LiveVehicleCard';
import LiveTrackingStats from '@/components/tracking/LiveTrackingStats';
import LiveTrackingMap from '@/components/tracking/LiveTrackingMap';

const LiveTracking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'alerts'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  const { 
    vehicles, 
    metrics, 
    syncMetrics, 
    isLoading, 
    isRefreshing, 
    forceRefresh,
    getVehiclesByStatus 
  } = useUnifiedVehicleData({
    search: searchTerm,
    status: statusFilter
  });

  const vehiclesByStatus = getVehiclesByStatus();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-600 mt-2">Real-time vehicle location and status monitoring</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-600 mt-2">
            Real-time vehicle location and status monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <Car className="h-4 w-4 mr-2" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Map
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <LiveTrackingStats 
        metrics={metrics}
        syncMetrics={syncMetrics}
        vehiclesByStatus={vehiclesByStatus}
      />

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vehicle Tracking Controls</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button 
                onClick={forceRefresh} 
                size="sm" 
                variant="outline"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by vehicle name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {showFilters && (
            <LiveTrackingFilters
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          )}
        </CardContent>
      </Card>

      {/* Content based on view mode */}
      {viewMode === 'map' ? (
        <LiveTrackingMap vehicles={vehicles} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <LiveVehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}

      {vehicles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No vehicles found matching your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveTracking;
