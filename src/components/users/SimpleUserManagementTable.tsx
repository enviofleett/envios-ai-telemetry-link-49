
import React, { useState } from 'react';
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  user_roles: Array<{ role: string }>;
  registration_status?: string;
}

interface SimpleUserManagementTableProps {
  users: User[];
  onAddUser: () => void;
  onUserClick: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

const SimpleUserManagementTable: React.FC<SimpleUserManagementTableProps> = ({
  users,
  onAddUser,
  onUserClick,
  onEditUser,
  onDeleteUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserRole = (user: User) => {
    const role = user.user_roles?.[0]?.role || 'user';
    const roleAbbrev = {
      'admin': 'Adm',
      'manager': 'Mgr', 
      'operator': 'Ops',
      'driver': 'Drvr',
      'user': 'User'
    };
    return roleAbbrev[role as keyof typeof roleAbbrev] || role.slice(0, 3);
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'inactive':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Active';
      case 'pending':
        return 'Pending';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Active';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  return (
    <div className="bg-white border border-gray-lighter rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-lighter">
        <h2 className="text-lg font-semibold text-primary-dark">User Management</h2>
        <Button
          onClick={onAddUser}
          className="bg-primary-dark text-white hover:bg-gray-darker flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 p-6 border-b border-gray-lighter">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-mid" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 border-gray-lighter"
          />
        </div>
        <Button variant="outline" className="border-gray-lighter text-primary-dark hover:bg-gray-background">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-background">
            <tr className="h-12 border-b border-gray-lighter">
              <th className="px-4 text-left">
                <Checkbox
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="border-gray-lighter"
                />
              </th>
              <th className="px-4 text-left text-sm font-medium text-gray-dark">User</th>
              <th className="px-4 text-left text-sm font-medium text-gray-dark">Email</th>
              <th className="px-4 text-left text-sm font-medium text-gray-dark">Phone</th>
              <th className="px-4 text-left text-sm font-medium text-gray-dark">Role</th>
              <th className="px-4 text-left text-sm font-medium text-gray-dark">Status</th>
              <th className="px-4 text-left text-sm font-medium text-gray-dark w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className="h-14 border-b border-gray-lighter hover:bg-gray-background cursor-pointer"
                onClick={() => onUserClick(user)}
              >
                <td className="px-4">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                    className="border-gray-lighter"
                  />
                </td>
                <td className="px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-teal-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-primary-dark">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 text-sm text-primary-dark">{user.email}</td>
                <td className="px-4 text-sm text-primary-dark">{user.phone_number || '-'}</td>
                <td className="px-4 text-sm text-primary-dark">{getUserRole(user)}</td>
                <td className="px-4">
                  <Badge variant={getStatusVariant(user.registration_status || 'active')}>
                    {getStatusLabel(user.registration_status || 'active')}
                  </Badge>
                </td>
                <td className="px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-gray-background">
                        <MoreHorizontal className="w-4 h-4 text-gray-mid" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border border-gray-lighter">
                      <DropdownMenuItem onClick={() => onUserClick(user)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditUser(user)}>
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteUser(user)}
                        className="text-red-600"
                      >
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-mid">
          {searchTerm ? 'No users found matching your search' : 'No users found'}
        </div>
      )}
    </div>
  );
};

export default SimpleUserManagementTable;
