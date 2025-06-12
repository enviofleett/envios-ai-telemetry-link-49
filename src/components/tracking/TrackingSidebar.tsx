
import React from 'react';
import { Search, Menu, X, Filter, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import type { VehicleData } from '@/types/vehicle';

interface TrackingSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedVehicle: VehicleData | null;
  onVehicleSelect: (vehicle: VehicleData) => void;
}

const TrackingSidebar: React.FC<TrackingSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedVehicle,
  onVehicleSelect
}) => {
  const { vehicles } = useStableVehicleData({ search: searchTerm });

  const filteredVehicles = vehicles.filter(vehicle => {
    if (statusFilter === 'all') return true;
    return vehicle.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'moving':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online':
      case 'moving':
        return 'default';
      case 'idle':
        return 'secondary';
      case 'offline':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (collapsed) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 p-2 space-y-2">
          {filteredVehicles.slice(0, 8).map((vehicle) => (
            <Button
              key={vehicle.deviceId}
              variant={selectedVehicle?.deviceId === vehicle.deviceId ? "default" : "ghost"}
              size="sm"
              onClick={() => onVehicleSelect(vehicle)}
              className="w-full p-2 h-12 flex flex-col items-center justify-center"
            >
              <Circle className={`h-3 w-3 ${getStatusColor(vehicle.status)} rounded-full`} />
              <span className="text-xs mt-1 truncate">{vehicle.deviceName.slice(0, 3)}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Fleet Vehicles</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="moving">Moving</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredVehicles.map((vehicle) => (
          <Card
            key={vehicle.deviceId}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedVehicle?.deviceId === vehicle.deviceId
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:bg-slate-50'
            }`}
            onClick={() => onVehicleSelect(vehicle)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Circle className={`h-3 w-3 ${getStatusColor(vehicle.status)} rounded-full`} />
                    <h3 className="font-medium text-slate-800 truncate">
                      {vehicle.deviceName || vehicle.deviceId}
                    </h3>
                  </div>
                  
                  <div className="space-y-1 text-sm text-slate-600">
                    {vehicle.licensePlate && (
                      <p className="truncate">{vehicle.licensePlate}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant={getStatusBadgeVariant(vehicle.status)} className="text-xs">
                        {vehicle.status}
                      </Badge>
                      {vehicle.speed !== undefined && (
                        <span className="text-xs">{vehicle.speed} km/h</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredVehicles.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Circle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
            <p>No vehicles found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingSidebar;
