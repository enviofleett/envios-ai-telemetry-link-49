
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal,
  Truck,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import VehicleChips from './VehicleChips';

interface UserRowProps {
  user: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUserAction: (action: string, user: any) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  isExpanded,
  onToggleExpand,
  onUserAction
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getGP51StatusBadge = (user: any) => {
    if (user.gp51_username) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Synced
          </Badge>
          <span className="text-xs text-gray-500">{user.gp51_username}</span>
        </div>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800">
        Not Synced
      </Badge>
    );
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="p-1 mr-3"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {user.name || 'Unknown User'}
                </div>
                <div className="text-sm text-gray-500">
                  ID: {user.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-900">
              <Mail className="h-3 w-3 mr-2 text-gray-400" />
              {user.email || 'No email'}
            </div>
            {user.phone_number && (
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="h-3 w-3 mr-2 text-gray-400" />
                {user.phone_number}
              </div>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getGP51StatusBadge(user)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <VehicleChips 
            vehicles={user.assigned_vehicles || []} 
            onManageVehicles={() => onUserAction('assign-vehicles', user)}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getStatusBadge(user.registration_status)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUserAction('edit', user)}>
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUserAction('assign-vehicles', user)}>
                Manage Vehicles
              </DropdownMenuItem>
              {!user.gp51_username && (
                <DropdownMenuItem onClick={() => onUserAction('sync-gp51', user)}>
                  Sync with GP51
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      
      {/* Expanded Row Content */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-6 py-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">User Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
                  <p><span className="font-medium">Type:</span> {user.gp51_user_type || 'N/A'}</p>
                  <p><span className="font-medium">Role:</span> {user.user_roles?.[0]?.role || 'user'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">GP51 Integration</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Username:</span> {user.gp51_username || 'Not linked'}</p>
                  <p><span className="font-medium">Sessions:</span> {user.gp51_sessions?.length || 0}</p>
                  <p><span className="font-medium">Last Sync:</span> {user.gp51_sessions?.[0]?.created_at ? new Date(user.gp51_sessions[0].created_at).toLocaleString() : 'Never'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Vehicle Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Assigned Vehicles:</span> {user.assigned_vehicles?.length || 0}</p>
                  <p><span className="font-medium">Active Vehicles:</span> {user.assigned_vehicles?.filter((v: any) => v.status === 'active').length || 0}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUserAction('assign-vehicles', user)}
                    className="mt-2"
                  >
                    <Truck className="h-3 w-3 mr-1" />
                    Manage Vehicles
                  </Button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default UserRow;
