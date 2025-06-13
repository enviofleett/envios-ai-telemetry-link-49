
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Car,
  MapPin,
  Gauge,
  User,
  Calendar,
  Camera,
  Upload,
  Workshop,
  FileText
} from 'lucide-react';
import { VehicleImageGallery } from './VehicleImageGallery';
import { VehicleLiveMap } from './VehicleLiveMap';
import { WorkshopActivationPanel } from './WorkshopActivationPanel';

interface VehicleProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    device_id: string;
    device_name: string;
    vin?: string;
    license_plate?: string;
    image_urls?: string[];
    fuel_tank_capacity_liters?: number;
    manufacturer_fuel_consumption_100km_l?: number;
    insurance_expiration_date?: string;
    license_expiration_date?: string;
    is_active: boolean;
    envio_user_id?: string;
    last_position?: {
      lat: number;
      lng: number;
      speed: number;
      timestamp: string;
    };
    envio_users?: {
      name: string;
      email: string;
    };
  } | null;
  liveData?: {
    speed: number;
    status: 'online' | 'offline' | 'moving';
    lastUpdate: Date;
  };
  onUpdateVehicle: (vehicleId: string, updates: any) => Promise<void>;
}

export const VehicleProfileModal: React.FC<VehicleProfileModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  liveData,
  onUpdateVehicle
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    insurance_expiration_date: '',
    license_expiration_date: '',
    vin: '',
    fuel_tank_capacity_liters: '',
    manufacturer_fuel_consumption_100km_l: ''
  });

  React.useEffect(() => {
    if (vehicle) {
      setFormData({
        insurance_expiration_date: vehicle.insurance_expiration_date || '',
        license_expiration_date: vehicle.license_expiration_date || '',
        vin: vehicle.vin || '',
        fuel_tank_capacity_liters: vehicle.fuel_tank_capacity_liters?.toString() || '',
        manufacturer_fuel_consumption_100km_l: vehicle.manufacturer_fuel_consumption_100km_l?.toString() || ''
      });
    }
  }, [vehicle]);

  const handleSave = async () => {
    if (!vehicle) return;

    const updates = {
      ...formData,
      fuel_tank_capacity_liters: formData.fuel_tank_capacity_liters ? parseFloat(formData.fuel_tank_capacity_liters) : null,
      manufacturer_fuel_consumption_100km_l: formData.manufacturer_fuel_consumption_100km_l ? parseFloat(formData.manufacturer_fuel_consumption_100km_l) : null
    };

    await onUpdateVehicle(vehicle.id, updates);
    setIsEditing(false);
  };

  if (!vehicle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {vehicle.device_name}
            {liveData && (
              <Badge className={`ml-2 ${
                liveData.status === 'online' ? 'bg-green-500' :
                liveData.status === 'moving' ? 'bg-blue-500' : 'bg-gray-400'
              }`}>
                {liveData.status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="live-tracking">Live Tracking</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="workshops">Workshops</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Device ID</Label>
                      <p className="text-sm font-mono">{vehicle.device_id}</p>
                    </div>
                    <div>
                      <Label>License Plate</Label>
                      <p className="text-sm">{vehicle.license_plate || 'Not set'}</p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="vin">VIN</Label>
                        <Input
                          id="vin"
                          value={formData.vin}
                          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                          placeholder="Vehicle Identification Number"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="fuel_capacity">Fuel Tank (L)</Label>
                          <Input
                            id="fuel_capacity"
                            type="number"
                            value={formData.fuel_tank_capacity_liters}
                            onChange={(e) => setFormData({ ...formData, fuel_tank_capacity_liters: e.target.value })}
                            placeholder="Liters"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fuel_consumption">Consumption (L/100km)</Label>
                          <Input
                            id="fuel_consumption"
                            type="number"
                            step="0.1"
                            value={formData.manufacturer_fuel_consumption_100km_l}
                            onChange={(e) => setFormData({ ...formData, manufacturer_fuel_consumption_100km_l: e.target.value })}
                            placeholder="L/100km"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label>VIN</Label>
                        <p className="text-sm font-mono">{vehicle.vin || 'Not set'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Fuel Tank</Label>
                          <p className="text-sm">{vehicle.fuel_tank_capacity_liters ? `${vehicle.fuel_tank_capacity_liters}L` : 'Not set'}</p>
                        </div>
                        <div>
                          <Label>Consumption</Label>
                          <p className="text-sm">{vehicle.manufacturer_fuel_consumption_100km_l ? `${vehicle.manufacturer_fuel_consumption_100km_l}L/100km` : 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {liveData && (
                    <>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        <span>Speed: {liveData.speed} km/h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          liveData.status === 'online' ? 'bg-green-500' :
                          liveData.status === 'moving' ? 'bg-blue-500' : 'bg-gray-400'
                        }`} />
                        <span>Status: {liveData.status}</span>
                      </div>
                    </>
                  )}
                  
                  {vehicle.last_position && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {vehicle.last_position.lat.toFixed(6)}, {vehicle.last_position.lng.toFixed(6)}
                      </span>
                    </div>
                  )}

                  {vehicle.envio_users && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">{vehicle.envio_users.name}</p>
                        <p className="text-xs text-gray-500">{vehicle.envio_users.email}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Vehicle</Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="live-tracking">
            <VehicleLiveMap vehicle={vehicle} liveData={liveData} />
          </TabsContent>

          <TabsContent value="images">
            <VehicleImageGallery
              vehicleId={vehicle.id}
              imageUrls={vehicle.image_urls || []}
              onImagesUpdated={(urls) => onUpdateVehicle(vehicle.id, { image_urls: urls })}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="insurance_date">Insurance Expiration</Label>
                      <Input
                        id="insurance_date"
                        type="date"
                        value={formData.insurance_expiration_date}
                        onChange={(e) => setFormData({ ...formData, insurance_expiration_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="license_date">License Expiration</Label>
                      <Input
                        id="license_date"
                        type="date"
                        value={formData.license_expiration_date}
                        onChange={(e) => setFormData({ ...formData, license_expiration_date: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Insurance Expiration</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{vehicle.insurance_expiration_date || 'Not set'}</span>
                      </div>
                    </div>
                    <div>
                      <Label>License Expiration</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{vehicle.license_expiration_date || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workshops">
            <WorkshopActivationPanel vehicleId={vehicle.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
