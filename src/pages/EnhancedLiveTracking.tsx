import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  Clock, 
  Fuel, 
  AlertTriangle,
  ChevronRight,
  Eye,
  MoreVertical,
  Car
} from 'lucide-react';
import { VehicleData, VehicleStatus } from '@/types/vehicle';

// Mock data with proper VehicleData structure
const mockVehicles: VehicleData[] = [
  {
    id: '1',
    device_id: 'TRK001',
    device_name: 'Fleet Vehicle 001',
    user_id: 'user1',
    sim_number: '1234567890',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    plateNumber: 'ABC-123',
    model: 'Toyota Hilux',
    driver: 'John Doe',
    speed: 45,
    fuel: 75,
    lastUpdate: new Date(),
    status: 'active' as VehicleStatus,
    is_active: true,
    isOnline: true,
    isMoving: true,
    alerts: [],
    location: { latitude: -1.2921, longitude: 36.8219 },
    mileage: 15420,
    engineHours: 1240,
    fuelType: 'Diesel',
    engineSize: 2.5,
  },
  {
    id: '2',
    device_id: 'TRK002',
    device_name: 'Fleet Vehicle 002',
    user_id: 'user2',
    sim_number: '9876543210',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: new Date().toISOString(),
    plateNumber: 'XYZ-789',
    model: 'Ford Ranger',
    driver: { name: 'Jane Smith' },
    speed: 0,
    fuel: 25,
    lastUpdate: new Date(),
    status: 'idle' as VehicleStatus,
    is_active: true,
    isOnline: false,
    isMoving: false,
    alerts: ['Low Fuel'],
    location: { latitude: -1.3036, longitude: 36.7833 },
    mileage: 8950,
    engineHours: 670,
    fuelType: 'Gasoline',
    engineSize: 3.5,
  },
  {
    id: '3',
    device_id: 'TRK003',
    device_name: 'Fleet Vehicle 003',
    user_id: 'user3',
    sim_number: '5555555555',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: new Date().toISOString(),
    plateNumber: 'LMN-456',
    model: 'Nissan Navara',
    driver: null,
    speed: 60,
    fuel: 90,
    lastUpdate: new Date(),
    status: 'active' as VehicleStatus,
    is_active: true,
    isOnline: true,
    isMoving: true,
    alerts: [],
    location: { latitude: -1.2864, longitude: 36.8172 },
    mileage: 21300,
    engineHours: 1580,
    fuelType: 'Diesel',
    engineSize: 2.3,
  },
  {
    id: '4',
    device_id: 'TRK004',
    device_name: 'Fleet Vehicle 004',
    user_id: 'user4',
    sim_number: '1111111111',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: new Date().toISOString(),
    plateNumber: 'PQR-000',
    model: 'Isuzu D-Max',
    driver: 'Alice Johnson',
    speed: 0,
    fuel: 10,
    lastUpdate: new Date(),
    status: 'maintenance' as VehicleStatus,
    is_active: false,
    isOnline: false,
    isMoving: false,
    alerts: ['Engine Overheat', 'Low Fuel'],
    location: { latitude: -1.2958, longitude: 36.7689 },
    mileage: 12750,
    engineHours: 950,
    fuelType: 'Diesel',
    engineSize: 3.0,
  },
  {
    id: '5',
    device_id: 'TRK005',
    device_name: 'Fleet Vehicle 005',
    user_id: 'user5',
    sim_number: '2222222222',
    created_at: '2024-01-20T00:00:00Z',
    updated_at: new Date().toISOString(),
    plateNumber: 'STU-999',
    model: 'Mitsubishi L200',
    driver: 'Bob Williams',
    speed: 25,
    fuel: 50,
    lastUpdate: new Date(),
    status: 'offline' as VehicleStatus,
    is_active: false,
    isOnline: false,
    isMoving: false,
    alerts: [],
    location: { latitude: -1.3145, longitude: 36.8322 },
    mileage: 17640,
    engineHours: 1320,
    fuelType: 'Diesel',
    engineSize: 2.4,
  }
];

const EnhancedLiveTracking: React.FC = () => {
  const [vehicles] = useState<VehicleData[]>(mockVehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  // Filter vehicles based on search and status
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = searchTerm === '' || 
        vehicle.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof vehicle.driver === 'string' ? 
          vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase()) :
          vehicle.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  // Status counts
  const statusCounts = useMemo(() => {
    return vehicles.reduce((acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
      return acc;
    }, {} as Record<VehicleStatus, number>);
  }, [vehicles]);

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = (status: VehicleStatus) => {
    switch (status) {
      case 'active': return 'Active';
      case 'idle': return 'Idle';
      case 'maintenance': return 'Maintenance';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const renderDriver = (driver: VehicleData['driver']) => {
    if (typeof driver === 'string') {
      return driver;
    }
    if (driver && typeof driver === 'object' && 'name' in driver) {
      return driver.name;
    }
    return 'Unassigned';
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Live Vehicle Tracking</h1>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles ({vehicles.length})</SelectItem>
                <SelectItem value="active">Active ({statusCounts.active || 0})</SelectItem>
                <SelectItem value="idle">Idle ({statusCounts.idle || 0})</SelectItem>
                <SelectItem value="offline">Offline ({statusCounts.offline || 0})</SelectItem>
                {statusCounts.maintenance > 0 && (
                  <SelectItem value="maintenance">Maintenance ({statusCounts.maintenance})</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-2">
              <div className="text-xs text-gray-500">Online</div>
              <div className="text-lg font-semibold text-green-600">
                {vehicles.filter(v => v.isOnline).length}
              </div>
            </Card>
            <Card className="p-2">
              <div className="text-xs text-gray-500">Moving</div>
              <div className="text-lg font-semibold text-blue-600">
                {vehicles.filter(v => v.isMoving).length}
              </div>
            </Card>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedVehicle?.id === vehicle.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => setSelectedVehicle(vehicle)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(vehicle.status)}`} />
                    <span className="font-medium text-sm">{vehicle.device_name}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    {vehicle.device_id} • {renderDriver(vehicle.driver)}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{vehicle.speed || 0} km/h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3 h-3" />
                      <span>{vehicle.fuel || 0}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{vehicle.lastUpdate ? new Date(vehicle.lastUpdate).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(vehicle.status)}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        {/* Map placeholder */}
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Interactive Map</h3>
            <p className="text-gray-500">Real-time vehicle positions will be displayed here</p>
          </div>
        </div>

        {/* Vehicle Details Panel */}
        {selectedVehicle && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{selectedVehicle.device_name}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedVehicle.status)}`} />
                <span>{getStatusText(selectedVehicle.status)}</span>
                <span>•</span>
                <span>{renderDriver(selectedVehicle.driver)}</span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Location Info */}
              <div>
                <h4 className="font-medium text-sm mb-2">Location</h4>
                <div className="text-sm text-gray-600">
                  <div>Speed: {selectedVehicle.speed || 0} km/h</div>
                  <div>Last Update: {selectedVehicle.lastUpdate ? selectedVehicle.lastUpdate.toLocaleString() : 'N/A'}</div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h4 className="font-medium text-sm mb-2">Vehicle Info</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Plate: {selectedVehicle.plateNumber || 'N/A'}</div>
                  <div>Model: {selectedVehicle.model || 'N/A'}</div>
                  <div>Fuel: {selectedVehicle.fuel || 0}%</div>
                  <div>Mileage: {selectedVehicle.mileage || 0} km</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Car className="w-4 h-4 mr-2" />
                  Track
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Details
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          size="sm"
          className="absolute top-4 left-4"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default EnhancedLiveTracking;
