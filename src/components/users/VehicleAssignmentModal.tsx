
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Truck, 
  Plus, 
  X,
  CheckCircle,
  Clock
} from 'lucide-react';

interface VehicleAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

const VehicleAssignmentModal: React.FC<VehicleAssignmentModalProps> = ({
  open,
  onClose,
  user,
  onSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedVehicles, setAssignedVehicles] = useState<string[]>(
    user.assigned_vehicles || []
  );

  // Mock available vehicles - in real implementation, this would come from an API
  const availableVehicles = [
    { id: 'DEV001', name: 'Vehicle 001', status: 'available' },
    { id: 'DEV002', name: 'Vehicle 002', status: 'available' },
    { id: 'DEV003', name: 'Vehicle 003', status: 'assigned' },
    { id: 'DEV004', name: 'Vehicle 004', status: 'available' },
  ];

  const filteredVehicles = availableVehicles.filter(vehicle =>
    vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignVehicle = (vehicleId: string) => {
    if (!assignedVehicles.includes(vehicleId)) {
      setAssignedVehicles([...assignedVehicles, vehicleId]);
    }
  };

  const handleUnassignVehicle = (vehicleId: string) => {
    setAssignedVehicles(assignedVehicles.filter(id => id !== vehicleId));
  };

  const handleSave = async () => {
    // In real implementation, this would call an API to save vehicle assignments
    console.log('Saving vehicle assignments for user:', user.id, assignedVehicles);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Manage Vehicle Assignments - {user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Vehicles</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-60 overflow-y-auto">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{vehicle.name}</div>
                      <div className="text-sm text-gray-500">{vehicle.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vehicle.status === 'assigned' ? (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Assigned
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleAssignVehicle(vehicle.id)}
                      disabled={
                        assignedVehicles.includes(vehicle.id) || 
                        vehicle.status === 'assigned'
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Assigned Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Assigned Vehicles ({assignedVehicles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-60 overflow-y-auto">
              {assignedVehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No vehicles assigned</p>
                </div>
              ) : (
                assignedVehicles.map((vehicleId) => {
                  const vehicle = availableVehicles.find(v => v.id === vehicleId) || 
                    { id: vehicleId, name: `Vehicle ${vehicleId}`, status: 'assigned' };
                  
                  return (
                    <div
                      key={vehicleId}
                      className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">{vehicle.name}</div>
                          <div className="text-sm text-gray-500">{vehicle.id}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnassignVehicle(vehicleId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleAssignmentModal;
