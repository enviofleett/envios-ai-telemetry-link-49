
import React from 'react';
import { Edit, Trash2, UserPlus, MoreHorizontal } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/types/user-management';

interface UserTableRowProps {
  user: User;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssignVehicles: () => void;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onAssignVehicles
}) => {
  const getUserRole = (user: User) => {
    return user.user_roles?.[0]?.role || 'user';
  };

  const getGP51Status = (user: User) => {
    if (!user.gp51_sessions?.length) return 'Not Connected';
    const activeSession = user.gp51_sessions.find(session => 
      new Date(session.token_expires_at) > new Date()
    );
    return activeSession ? 'Active' : 'Expired';
  };

  const getUserTypeLabel = (userType?: number) => {
    const labels = {
      1: 'Company Admin',
      2: 'Sub Admin',
      3: 'End User',
      4: 'Device User'
    };
    return userType ? labels[userType as keyof typeof labels] : 'Not Set';
  };

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </TableCell>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.phone_number || '-'}</TableCell>
      <TableCell>
        <Badge variant={getUserRole(user) === 'admin' ? 'default' : 'secondary'}>
          {getUserRole(user)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={getGP51Status(user) === 'Active' ? 'default' : 'outline'}>
          {getGP51Status(user)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {getUserTypeLabel(user.gp51_user_type)}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-600">
          {user.assigned_vehicles?.length || 0} vehicles
        </span>
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {new Date(user.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAssignVehicles}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Vehicles
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
