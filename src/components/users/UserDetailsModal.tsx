
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  user_roles: Array<{ role: string }>;
  gp51_user_type?: number;
  registration_status?: string;
  assigned_vehicles?: Array<{
    id: string;
    plate_number?: string;
    status: string;
    last_update: string;
  }>;
}

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onEditUser: (user: User) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  open,
  onOpenChange,
  user,
  onEditUser
}) => {
  if (!user) return null;

  const getUserRole = () => {
    return user.user_roles?.[0]?.role || 'user';
  };

  const getUserTypeLabel = () => {
    const labels = {
      1: 'Company Admin',
      2: 'Sub Admin',
      3: 'End User',
      4: 'Device User'
    };
    return user.gp51_user_type ? labels[user.gp51_user_type as keyof typeof labels] : 'Not Set';
  };

  const getStatusVariant = (status?: string) => {
    if (!status) return 'outline';
    
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'inactive':
      case 'offline':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] bg-white rounded-lg shadow-lg p-6">
        <DialogHeader className="border-b border-gray-lighter pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-primary-dark">
                User Details - {user.name}
              </DialogTitle>
              <p className="text-sm text-gray-mid mt-1">
                Complete user information and assigned vehicles
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 p-0 hover:bg-gray-background"
            >
              <X className="w-4 h-4 text-gray-mid" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white border border-gray-lighter rounded-lg p-6">
            <h3 className="text-base font-semibold text-primary-dark mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-mid">Name</label>
                <div className="text-sm text-primary-dark mt-1">{user.name}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-mid">Email</label>
                <div className="text-sm text-primary-dark mt-1">{user.email}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-mid">Phone</label>
                <div className="text-sm text-primary-dark mt-1">{user.phone_number || '-'}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-mid">Role</label>
                <div className="text-sm text-primary-dark mt-1 capitalize">{getUserRole()}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-mid">Type</label>
                <div className="text-sm text-primary-dark mt-1">{getUserTypeLabel()}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-mid">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(user.registration_status)}>
                    {user.registration_status || 'Active'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Vehicles */}
          <div className="bg-white border border-gray-lighter rounded-lg p-6">
            <h3 className="text-base font-semibold text-primary-dark mb-4">
              Assigned Vehicles
            </h3>
            <div className="border border-gray-lighter rounded">
              <div className="bg-gray-background px-3 py-2 border-b border-gray-lighter">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-dark">
                  <div>Vehicle ID</div>
                  <div>Plate Number</div>
                  <div>Status</div>
                  <div>Last Update</div>
                </div>
              </div>
              <div className="divide-y divide-gray-lighter">
                {user.assigned_vehicles && user.assigned_vehicles.length > 0 ? (
                  user.assigned_vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="px-3 py-2">
                      <div className="grid grid-cols-4 gap-4 text-sm text-primary-dark">
                        <div>{vehicle.id}</div>
                        <div>{vehicle.plate_number || '-'}</div>
                        <div>
                          <Badge variant={getStatusVariant(vehicle.status)}>
                            {vehicle.status || 'Unknown'}
                          </Badge>
                        </div>
                        <div>{vehicle.last_update}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-gray-mid">
                    No vehicles assigned
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-lighter text-primary-dark hover:bg-gray-background"
          >
            Close
          </Button>
          <Button
            onClick={() => onEditUser(user)}
            className="bg-primary-dark text-white hover:bg-gray-darker"
          >
            Edit User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
