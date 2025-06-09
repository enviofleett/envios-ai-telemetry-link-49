
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Activity, 
  MapPin, 
  ChevronDown, 
  ChevronRight,
  Car,
  Clock,
  Fuel
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface GroupedVehicleListProps {
  vehicles: Vehicle[];
  grouping: 'none' | 'driver' | 'status' | 'geofence';
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedVehicle?: Vehicle | null;
}

interface VehicleGroup {
  key: string;
  name: string;
  vehicles: Vehicle[];
  icon: React.ReactNode;
  color: string;
}

const GroupedVehicleList: React.FC<GroupedVehicleListProps> = ({
  vehicles,
  grouping,
  onVehicleSelect,
  selectedVehicle
}) => {
  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-100 text-yellow-800">Idle</Badge>;
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const groupVehicles = (): VehicleGroup[] => {
    if (grouping === 'none') {
      return [{
        key: 'all',
        name: 'All Vehicles',
        vehicles: vehicles,
        icon: <Car className="h-4 w-4" />,
        color: 'text-primary'
      }];
    }

    const groups: { [key: string]: VehicleGroup } = {};

    vehicles.forEach(vehicle => {
      let groupKey: string;
      let groupName: string;
      let icon: React.ReactNode;
      let color: string;

      switch (grouping) {
        case 'driver':
          groupKey = vehicle.devicename || 'unknown';
          groupName = vehicle.devicename || 'Unknown Driver';
          icon = <User className="h-4 w-4" />;
          color = 'text-blue-600';
          break;
        case 'status':
          const status = getVehicleStatus(vehicle);
          groupKey = status;
          groupName = status.charAt(0).toUpperCase() + status.slice(1);
          icon = <Activity className="h-4 w-4" />;
          color = status === 'online' ? 'text-green-600' : 
                 status === 'idle' ? 'text-yellow-600' : 'text-gray-600';
          break;
        case 'geofence':
          // Mock geofence assignment - in real app, this would be calculated
          groupKey = 'area-' + Math.floor(Math.random() * 3);
          groupName = ['Downtown Area', 'Industrial Zone', 'Residential Area'][Math.floor(Math.random() * 3)];
          icon = <MapPin className="h-4 w-4" />;
          color = 'text-purple-600';
          break;
        default:
          groupKey = 'default';
          groupName = 'Default';
          icon = <Car className="h-4 w-4" />;
          color = 'text-primary';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          name: groupName,
          vehicles: [],
          icon: icon,
          color: color
        };
      }

      groups[groupKey].vehicles.push(vehicle);
    });

    return Object.values(groups).sort((a, b) => b.vehicles.length - a.vehicles.length);
  };

  const vehicleGroups = groupVehicles();

  const VehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
    const status = getVehicleStatus(vehicle);
    const isSelected = selectedVehicle?.deviceid === vehicle.deviceid;
    
    return (
      <div
        className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
        }`}
        onClick={() => onVehicleSelect(vehicle)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: status === 'online' ? '#22c55e' : 
                                status === 'idle' ? '#eab308' : '#6b7280' 
              }}
            />
            <div>
              <div className="font-medium text-sm">{vehicle.devicename || 'Unknown'}</div>
              <div className="text-xs text-muted-foreground">{vehicle.deviceid}</div>
            </div>
          </div>
          {getStatusBadge(status)}
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span>{vehicle.lastPosition?.speed || 0} km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="h-3 w-3 text-muted-foreground" />
            <span>85%</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>
              {vehicle.lastPosition?.updatetime ? 
                new Date(vehicle.lastPosition.updatetime).toLocaleTimeString() : 
                'N/A'
              }
            </span>
          </div>
        </div>
      </div>
    );
  };

  const GroupHeader: React.FC<{ group: VehicleGroup; isOpen: boolean }> = ({ group, isOpen }) => (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-t-lg">
      <div className="flex items-center gap-2">
        <span className={group.color}>{group.icon}</span>
        <h3 className="font-medium text-sm">{group.name}</h3>
        <Badge variant="outline" className="text-xs">
          {group.vehicles.length}
        </Badge>
      </div>
      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </div>
  );

  if (vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Car className="h-8 w-8 mx-auto mb-2" />
            <p>No vehicles match the current filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {vehicleGroups.map((group) => (
        <Card key={group.key}>
          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full p-0 h-auto">
                <GroupHeader group={group} isOpen={true} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-2">
                {group.vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.deviceid} vehicle={vehicle} />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
};

export default GroupedVehicleList;
