
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  MapPin,
  Gauge,
  Clock
} from 'lucide-react';
import { useVehicleData } from '@/hooks/useVehicleData';
import { useAdvancedExport } from '@/hooks/useAdvancedExport';
import { Progress } from '@/components/ui/progress';

const VehicleManagementPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const { 
    data: vehicles, 
    isLoading, 
    error,
    refetch 
  } = useVehicleData({ search: searchTerm, status: statusFilter });
  
  const { exportVehicles, isExporting, progress } = useAdvancedExport();

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    exportVehicles(format, {
      search: searchTerm,
      status: statusFilter,
      includePositions: true
    });
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'moving': return 'bg-blue-100 text-blue-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Management
            <Badge variant="outline">{vehicles?.length || 0} vehicles</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Exporting vehicle data...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {showAdvancedFilters && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Status Filters:</label>
                <div className="flex gap-2 flex-wrap">
                  {['online', 'offline', 'moving', 'idle'].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter.includes(status) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleStatusFilter(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                >
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={isExporting}
                >
                  Export Excel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {vehicles && vehicles.length > 0 ? (
            vehicles.map((vehicle: any) => (
              <div key={vehicle.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{vehicle.device_name || `Device ${vehicle.device_id}`}</h4>
                    <p className="text-sm text-gray-600">ID: {vehicle.device_id}</p>
                  </div>
                  <Badge className={getStatusColor(vehicle.status)}>
                    {vehicle.status || 'Unknown'}
                  </Badge>
                </div>

                {vehicle.lastPosition && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Location:</span>
                      <span className="font-mono text-xs">
                        {vehicle.lastPosition.lat?.toFixed(4)}, {vehicle.lastPosition.lon?.toFixed(4)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Gauge className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Speed:</span>
                      <span className="font-medium">
                        {vehicle.lastPosition.speed || 0} km/h
                      </span>
                    </div>

                    <div className="flex items-center gap-1 col-span-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Last Update:</span>
                      <span className="text-xs">
                        {vehicle.lastPosition.updatetime ? 
                          new Date(vehicle.lastPosition.updatetime).toLocaleString() : 
                          'No data'
                        }
                      </span>
                    </div>
                  </div>
                )}

                {!vehicle.lastPosition && (
                  <div className="text-center py-4 text-gray-500">
                    <MapPin className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No location data available</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No vehicles found</p>
              {searchTerm && (
                <p className="text-sm mt-1">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleManagementPanel;
