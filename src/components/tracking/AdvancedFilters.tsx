
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Filter, 
  MapPin, 
  User, 
  Save, 
  Trash2, 
  RotateCcw,
  Clock,
  Fuel,
  Activity
} from 'lucide-react';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface GeofenceFilter {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // in meters
  enabled: boolean;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: {
    status: string[];
    drivers: string[];
    geofences: string[];
    dateRange: { from: Date | null; to: Date | null };
    fuelLevel: { min: number; max: number };
    speedRange: { min: number; max: number };
  };
}

interface AdvancedFiltersProps {
  vehicles: Vehicle[];
  onFiltersChange: (filteredVehicles: Vehicle[]) => void;
  onGroupingChange: (grouping: 'none' | 'driver' | 'status' | 'geofence') => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  vehicles,
  onFiltersChange,
  onGroupingChange
}) => {
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [driverFilters, setDriverFilters] = useState<string[]>([]);
  const [geofenceFilters, setGeofenceFilters] = useState<GeofenceFilter[]>([]);
  const [activeGeofences, setActiveGeofences] = useState<string[]>([]);
  const [fuelRange, setFuelRange] = useState({ min: 0, max: 100 });
  const [speedRange, setSpeedRange] = useState({ min: 0, max: 200 });
  const [grouping, setGrouping] = useState<'none' | 'driver' | 'status' | 'geofence'>('none');
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');

  // Mock geofences - in real app, these would come from backend
  const mockGeofences: GeofenceFilter[] = [
    {
      id: 'warehouse-1',
      name: 'Main Warehouse',
      center: { lat: 40.7128, lng: -74.0060 },
      radius: 500,
      enabled: false
    },
    {
      id: 'depot-central',
      name: 'Central Depot',
      center: { lat: 40.7589, lng: -73.9851 },
      radius: 300,
      enabled: false
    },
    {
      id: 'service-area-1',
      name: 'Service Area North',
      center: { lat: 40.7831, lng: -73.9712 },
      radius: 1000,
      enabled: false
    }
  ];

  useEffect(() => {
    setGeofenceFilters(mockGeofences);
  }, []);

  // Get unique drivers and statuses
  const uniqueDrivers = [...new Set(vehicles.map(v => v.devicename || 'Unknown Driver'))];
  const uniqueStatuses = ['online', 'idle', 'offline', 'maintenance'];

  // Apply filters
  useEffect(() => {
    let filtered = [...vehicles];

    // Status filter
    if (statusFilters.length > 0) {
      filtered = filtered.filter(vehicle => {
        const status = getVehicleStatus(vehicle);
        return statusFilters.includes(status);
      });
    }

    // Driver filter
    if (driverFilters.length > 0) {
      filtered = filtered.filter(vehicle => 
        driverFilters.includes(vehicle.devicename || 'Unknown Driver')
      );
    }

    // Geofence filter
    if (activeGeofences.length > 0) {
      filtered = filtered.filter(vehicle => {
        if (!vehicle.lastPosition) return false;
        
        return activeGeofences.some(geofenceId => {
          const geofence = geofenceFilters.find(g => g.id === geofenceId);
          if (!geofence) return false;
          
          const distance = calculateDistance(
            vehicle.lastPosition!.lat,
            vehicle.lastPosition!.lon,
            geofence.center.lat,
            geofence.center.lng
          );
          
          return distance <= geofence.radius;
        });
      });
    }

    onFiltersChange(filtered);
  }, [vehicles, statusFilters, driverFilters, activeGeofences, fuelRange, speedRange]);

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleDriverFilter = (driver: string) => {
    setDriverFilters(prev => 
      prev.includes(driver) 
        ? prev.filter(d => d !== driver)
        : [...prev, driver]
    );
  };

  const toggleGeofenceFilter = (geofenceId: string) => {
    setActiveGeofences(prev => 
      prev.includes(geofenceId) 
        ? prev.filter(g => g !== geofenceId)
        : [...prev, geofenceId]
    );
  };

  const clearAllFilters = () => {
    setStatusFilters([]);
    setDriverFilters([]);
    setActiveGeofences([]);
    setFuelRange({ min: 0, max: 100 });
    setSpeedRange({ min: 0, max: 200 });
    setGrouping('none');
  };

  const saveFilterPreset = () => {
    if (!newPresetName.trim()) return;
    
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name: newPresetName,
      filters: {
        status: statusFilters,
        drivers: driverFilters,
        geofences: activeGeofences,
        dateRange: { from: null, to: null },
        fuelLevel: fuelRange,
        speedRange: speedRange
      }
    };
    
    setFilterPresets(prev => [...prev, preset]);
    setNewPresetName('');
  };

  const loadFilterPreset = (preset: FilterPreset) => {
    setStatusFilters(preset.filters.status);
    setDriverFilters(preset.filters.drivers);
    setActiveGeofences(preset.filters.geofences);
    setFuelRange(preset.filters.fuelLevel);
    setSpeedRange(preset.filters.speedRange);
  };

  const deleteFilterPreset = (presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
  };

  const handleGroupingChange = (newGrouping: 'none' | 'driver' | 'status' | 'geofence') => {
    setGrouping(newGrouping);
    onGroupingChange(newGrouping);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Filters & Grouping
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="grouping">Grouping</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="space-y-6">
            {/* Status Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Vehicle Status
              </Label>
              <div className="flex flex-wrap gap-2">
                {uniqueStatuses.map(status => (
                  <Button
                    key={status}
                    variant={statusFilters.includes(status) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStatusFilter(status)}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Driver Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Drivers ({driverFilters.length} selected)
              </Label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {uniqueDrivers.map(driver => (
                  <div key={driver} className="flex items-center space-x-2">
                    <Checkbox
                      id={`driver-${driver}`}
                      checked={driverFilters.includes(driver)}
                      onCheckedChange={() => toggleDriverFilter(driver)}
                    />
                    <Label 
                      htmlFor={`driver-${driver}`} 
                      className="text-sm truncate flex-1"
                    >
                      {driver}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Geofence Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Geofences ({activeGeofences.length} active)
              </Label>
              <div className="space-y-2">
                {geofenceFilters.map(geofence => (
                  <div key={geofence.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`geofence-${geofence.id}`}
                        checked={activeGeofences.includes(geofence.id)}
                        onCheckedChange={() => toggleGeofenceFilter(geofence.id)}
                      />
                      <div>
                        <Label htmlFor={`geofence-${geofence.id}`} className="text-sm font-medium">
                          {geofence.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Radius: {geofence.radius}m
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {geofence.radius}m
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={clearAllFilters} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="grouping" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Group Vehicles By</Label>
              <Select value={grouping} onValueChange={handleGroupingChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grouping method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="geofence">Geofence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {grouping !== 'none' && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Vehicles are now grouped by <strong>{grouping}</strong>. 
                  The list and map view will reflect this grouping.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="presets" className="space-y-4">
            {/* Save New Preset */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Save Current Filters</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Preset name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
                <Button onClick={saveFilterPreset} disabled={!newPresetName.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            {/* Saved Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Saved Presets</Label>
              {filterPresets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved presets yet.</p>
              ) : (
                <div className="space-y-2">
                  {filterPresets.map(preset => (
                    <div key={preset.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="text-sm font-medium">{preset.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {preset.filters.status.length} status, {preset.filters.drivers.length} drivers, {preset.filters.geofences.length} geofences
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadFilterPreset(preset)}
                        >
                          Load
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteFilterPreset(preset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters;
