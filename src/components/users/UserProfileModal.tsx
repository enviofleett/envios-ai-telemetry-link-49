
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserProfile } from '@/hooks/useUserProfiles';
import { Car, Mail, Phone, Calendar, User, Edit, MapPin } from 'lucide-react';

interface UserProfileModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (user: UserProfile) => void;
  onAssignVehicles: (user: UserProfile) => void;
}

export default function UserProfileModal({
  user,
  open,
  onOpenChange,
  onEdit,
  onAssignVehicles
}: UserProfileModalProps) {
  if (!user) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'pending_admin_approval': 'bg-yellow-100 text-yellow-800',
      'pending_email_verification': 'bg-blue-100 text-blue-800',
      'pending_phone_verification': 'bg-orange-100 text-orange-800',
      'rejected': 'bg-red-100 text-red-800'
    } as const;
    
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-800',
      'fleet_manager': 'bg-blue-100 text-blue-800',
      'dispatcher': 'bg-indigo-100 text-indigo-800',
      'driver': 'bg-green-100 text-green-800',
      'user': 'bg-gray-100 text-gray-800'
    } as const;
    
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.profile_picture_url} />
              <AvatarFallback>
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-semibold">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {user.email}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete user profile and vehicle assignment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Role */}
          <div className="flex gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
              <Badge className={getStatusColor(user.registration_status)}>
                {user.registration_status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Role</h4>
              <Badge className={getRoleColor(user.role)}>
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
              </div>
              
              {user.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">Phone</div>
                    <div className="text-sm text-gray-600">{user.phone_number}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">Member Since</div>
                  <div className="text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vehicle Assignments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Car className="w-5 h-5" />
                Assigned Vehicles ({user.vehicle_count || 0})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignVehicles(user)}
              >
                Manage Vehicles
              </Button>
            </div>

            {user.assigned_vehicles && user.assigned_vehicles.length > 0 ? (
              <div className="space-y-2">
                {user.assigned_vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Car className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">
                          {vehicle.device_name || vehicle.device_id}
                        </div>
                        {vehicle.plate_number && (
                          <div className="text-xs text-gray-500">
                            Plate: {vehicle.plate_number}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">{vehicle.device_id}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No vehicles assigned</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onAssignVehicles(user)}
                >
                  Assign Vehicles
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={() => onEdit(user)} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => onAssignVehicles(user)}
              className="flex-1"
            >
              <Car className="w-4 h-4 mr-2" />
              Manage Vehicles
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
