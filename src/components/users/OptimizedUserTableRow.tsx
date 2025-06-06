
import React, { memo, useCallback } from 'react';
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

interface OptimizedUserTableRowProps {
  user: User;
  isSelected: boolean;
  onSelect: (userId: string, checked: boolean) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onAssignVehicles: (user: User) => void;
}

const OptimizedUserTableRow = memo<OptimizedUserTableRowProps>(({
  user,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onAssignVehicles
}) => {
  const handleSelect = useCallback((checked: boolean) => {
    onSelect(user.id, checked);
  }, [onSelect, user.id]);

  const handleEdit = useCallback(() => {
    onEdit(user);
  }, [onEdit, user]);

  const handleDelete = useCallback(() => {
    onDelete(user.id);
  }, [onDelete, user.id]);

  const handleAssignVehicles = useCallback(() => {
    onAssignVehicles(user);
  }, [onAssignVehicles, user]);

  const userRole = user.user_roles?.[0]?.role || 'user';
  const gp51Status = !user.gp51_sessions?.length 
    ? 'Not Connected'
    : user.gp51_sessions.find(session => new Date(session.token_expires_at) > new Date())
      ? 'Active' 
      : 'Expired';
  
  const userTypeLabel = user.gp51_user_type 
    ? { 1: 'Company Admin', 2: 'Sub Admin', 3: 'End User', 4: 'Device User' }[user.gp51_user_type] || 'Not Set'
    : 'Not Set';

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleSelect}
        />
      </TableCell>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.phone_number || '-'}</TableCell>
      <TableCell>
        <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
          {userRole}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={gp51Status === 'Active' ? 'default' : 'outline'}>
          {gp51Status}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {userTypeLabel}
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
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAssignVehicles}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Vehicles
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
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
}, (prevProps, nextProps) => {
  // Custom comparison function for memo optimization
  return (
    prevProps.user.id === nextProps.user.id &&
    prevProps.user.name === nextProps.user.name &&
    prevProps.user.email === nextProps.user.email &&
    prevProps.user.phone_number === nextProps.user.phone_number &&
    prevProps.user.created_at === nextProps.user.created_at &&
    prevProps.isSelected === nextProps.isSelected &&
    JSON.stringify(prevProps.user.user_roles) === JSON.stringify(nextProps.user.user_roles) &&
    JSON.stringify(prevProps.user.gp51_sessions) === JSON.stringify(nextProps.user.gp51_sessions) &&
    prevProps.user.gp51_user_type === nextProps.user.gp51_user_type &&
    prevProps.user.assigned_vehicles?.length === nextProps.user.assigned_vehicles?.length
  );
});

OptimizedUserTableRow.displayName = 'OptimizedUserTableRow';

export default OptimizedUserTableRow;
