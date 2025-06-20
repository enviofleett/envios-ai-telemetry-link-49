
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Car, Search, Plus, MapPin, Clock } from 'lucide-react';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import DataLoadingWrapper from '@/components/common/DataLoadingWrapper';

const EnhancedVehicleManagement: React.FC = () => {
  const { vehicles, loading, error, refreshData, healthStatus } = useUnifiedData();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'secondary';
      case 'inactive': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor your fleet vehicles
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline">
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <DataLoadingWrapper
        loading={loading}
        error={error}
        healthStatus={healthStatus}
        onRefresh={refreshData}
      >
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                  <p className="text-2xl font-bold">{vehicles.length}</p>
                </div>
                <Car className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Online</p>
                  <p className="text-2xl font-bold text-green-600">
                    {vehicles.filter(v => v.status === 'online').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Offline/Inactive</p>
                  <p className="text-2xl font-bold text-red-600">
                    {vehicles.filter(v => v.status !== 'online').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle List */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicles ({filteredVehicles.length})</CardTitle>
            <CardDescription>
              {searchTerm ? `Showing results for "${searchTerm}"` : 'All vehicles'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  {searchTerm ? 'No vehicles found' : 'No vehicles available'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Add vehicles to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(vehicle.status)}`} />
                        <div>
                          <h3 className="font-medium">{vehicle.name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {vehicle.id}</p>
                          {vehicle.gp51_device_id && (
                            <p className="text-xs text-muted-foreground">
                              GP51 ID: {vehicle.gp51_device_id}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                          {vehicle.status}
                        </Badge>
                        
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {vehicle.lastUpdate.toLocaleString()}
                        </div>
                        
                        {vehicle.location && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {vehicle.location.address || `${vehicle.location.latitude.toFixed(4)}, ${vehicle.location.longitude.toFixed(4)}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DataLoadingWrapper>
    </div>
  );
};

export default EnhancedVehicleManagement;
