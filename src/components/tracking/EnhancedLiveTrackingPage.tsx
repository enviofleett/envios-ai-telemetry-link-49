
import React, { useState, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';
import { VehicleData } from '@/types/vehicle';

// Import Leaflet marker images using ES modules
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet marker configuration (required to show the markers)
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Vehicle {
  id: string;
  name: string;
  status: string;
  isMoving: boolean;
  lastPosition: {
    latitude: number;
    longitude: number;
  } | null;
}

const getVehicleIcon = (vehicle: VehicleData) => {
  const statusColor = vehicle.status === 'online' ? 'green' : vehicle.status === 'moving' ? 'blue' : 'gray';
  return <Circle className={`h-6 w-6 text-${statusColor}-500`} />;
};

const getStatusBadge = (status: string, isMoving: boolean) => {
  let label = status;
  if (isMoving) {
    label = 'moving';
  }

  const badgeColor = status === 'online' ? 'green' : status === 'moving' ? 'blue' : 'gray';

  return (
    <Badge className={`bg-${badgeColor}-100 text-${badgeColor}-800 border-0`}>
      {label}
    </Badge>
  );
};

const EnhancedLiveTrackingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const { vehicles, isLoading, metrics } = useEnhancedVehicleData();

  const handleVehicleSelect = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    if (vehicle.last_position) {
      mapRef.current?.flyTo([vehicle.last_position.latitude, vehicle.last_position.longitude], 15);
    }
  };

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle =>
        vehicle.device_name.toLowerCase().includes(term) ||
        vehicle.device_id.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    return filtered;
  }, [vehicles, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="w-1/3 max-w-sm flex flex-col bg-white border-r">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Vehicles</h2>
            <div className="mt-2">
              <Input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mt-2">
              <Label htmlFor="status">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map(vehicle => (
                <div 
                  key={vehicle.device_id} 
                  onClick={() => handleVehicleSelect(vehicle)}
                  className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${
                    selectedVehicle?.device_id === vehicle.device_id ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary-light hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getVehicleIcon(vehicle)}
                      <div>
                        <h3 className="font-semibold text-sm">{vehicle.device_name}</h3>
                        <p className="text-xs text-muted-foreground">{vehicle.device_id}</p>
                      </div>
                    </div>
                    {getStatusBadge(vehicle.status, vehicle.isMoving || false)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t text-xs text-muted-foreground">
            <p>Total Vehicles: {metrics.total}</p>
            <p>Online: {metrics.online}</p>
            <p>Offline: {metrics.offline}</p>
          </div>
        </aside>
        <main className="flex-1 relative">
          {selectedVehicle ? (
            <MapContainer
              center={selectedVehicle.last_position ? [selectedVehicle.last_position.latitude, selectedVehicle.last_position.longitude] : [0, 0]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {selectedVehicle.last_position && (
                <Marker position={[selectedVehicle.last_position.latitude, selectedVehicle.last_position.longitude]}>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Select a vehicle to view its location.</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default EnhancedLiveTrackingPage;
