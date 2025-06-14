import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Car, 
  Edit, 
  Save, 
  X, 
  MapPin, 
  Calendar,
  User,
  Package,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { VehicleData } from '@/types/vehicle';

interface VehicleProfileTabProps {
  vehicle: VehicleData;
}

const VehicleProfileTab: React.FC<VehicleProfileTabProps> = ({ vehicle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedVehicleName, setEditedVehicleName] = useState(vehicle.device_name);
  const [notes, setNotes] = useState('');
  const [assignedUser, setAssignedUser] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
    toast({
      title: "Vehicle profile updated",
      description: "Your changes have been saved.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedVehicleName(vehicle.device_name);
    setNotes('');
    setAssignedUser('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          {isEditing ? (
            <Input
              value={editedVehicleName}
              onChange={(e) => setEditedVehicleName(e.target.value)}
              className="text-lg font-semibold"
            />
          ) : (
            <>{vehicle.device_name}</>
          )}
        </CardTitle>
        <div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="deviceId">Device ID</Label>
            <Input id="deviceId" value={vehicle.device_id} readOnly />
          </div>
          <div>
            <Label htmlFor="lastUpdate">Last Update</Label>
            <Input
              id="lastUpdate"
              value={vehicle.last_position?.timestamp ? new Date(vehicle.last_position.timestamp).toLocaleString() : 'N/A'}
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              value={vehicle.last_position?.latitude?.toString() || 'N/A'}
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              value={vehicle.last_position?.longitude?.toString() || 'N/A'}
              readOnly
            />
          </div>
        </div>

        <Separator />

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Vehicle notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            readOnly={!isEditing}
          />
        </div>

        <Separator />

        <div>
          <Label htmlFor="assignedUser">Assigned User</Label>
          <Select
            onValueChange={setAssignedUser}
            defaultValue={assignedUser}
            disabled={!isEditing}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user-1">User 1</SelectItem>
              <SelectItem value="user-2">User 2</SelectItem>
              <SelectItem value="user-3">User 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleProfileTab;
