
import React from 'react';
import { MoreHorizontal, Car, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile } from '@/hooks/useUserProfiles';

interface UserProfileRowProps {
  profile: UserProfile;
  onUserClick: (user: UserProfile) => void;
  onEditUser: (user: UserProfile) => void;
  onAssignVehicles: (user: UserProfile) => void;
}

export default function UserProfileRow({
  profile,
  onUserClick,
  onEditUser,
  onAssignVehicles
}: UserProfileRowProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'pending_admin_approval': 'secondary',
      'pending_email_verification': 'outline',
      'pending_phone_verification': 'outline',
      'rejected': 'destructive'
    } as const;
    
    const labels = {
      'active': 'Active',
      'pending_admin_approval': 'Pending Approval',
      'pending_email_verification': 'Email Pending',
      'pending_phone_verification': 'Phone Pending',
      'rejected': 'Rejected'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'fleet_manager': 'bg-blue-100 text-blue-800',
      'dispatcher': 'bg-purple-100 text-purple-800',
      'driver': 'bg-green-100 text-green-800',
      'user': 'bg-gray-100 text-gray-800'
    } as const;

    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => onUserClick(profile)}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.profile_picture_url} />
            <AvatarFallback>
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {profile.first_name} {profile.last_name}
            </div>
            <div className="text-sm text-gray-500">
              {profile.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-900">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            {profile.email}
          </div>
          {profile.phone_number && (
            <div className="flex items-center text-sm text-gray-500">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              {profile.phone_number}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getRoleBadge(profile.role)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(profile.registration_status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Car className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm text-gray-900">{profile.vehicle_count || 0}</span>
          {profile.vehicle_count && profile.vehicle_count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUserClick(profile);
              }}
              className="ml-2"
            >
              View
            </Button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onUserClick(profile)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditUser(profile)}>
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAssignVehicles(profile)}>
              Assign Vehicles
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
