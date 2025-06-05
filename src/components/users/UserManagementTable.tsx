
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2, UserPlus, Upload, Download, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  created_at: string;
  user_roles: Array<{ role: string }>;
  gp51_sessions: Array<{
    id: string;
    username: string;
    token_expires_at: string;
  }>;
  gp51_username?: string;
  gp51_user_type?: number;
  registration_status?: string;
  assigned_vehicles?: string[];
}

interface UserManagementTableProps {
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onImportUsers: () => void;
  onAssignVehicles: (user: User) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  onCreateUser,
  onEditUser,
  onImportUsers,
  onAssignVehicles,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-enhanced'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('user-management');
      if (error) throw error;
      return data.users as User[];
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke(`user-management/${userId}`, {
        method: 'DELETE'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-enhanced'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting user', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await Promise.all(
        userIds.map(id => 
          supabase.functions.invoke(`user-management/${id}`, { method: 'DELETE' })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-enhanced'] });
      setSelectedUsers([]);
      toast({ title: `${selectedUsers.length} users deleted successfully` });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting users', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'name' | 'email' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(sortedUsers.map(user => user.id));
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

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      bulkDeleteMutation.mutate(selectedUsers);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'GP51 Username', 'Status', 'Created At'],
      ...sortedUsers.map(user => [
        user.name,
        user.email,
        user.phone_number || '',
        user.user_roles?.[0]?.role || 'user',
        user.gp51_username || '',
        user.registration_status || 'active',
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedUsers.length})
            </Button>
          )}
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={onImportUsers}>
            <Upload className="h-4 w-4 mr-2" />
            Import Users
          </Button>
          <Button onClick={onCreateUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('email')}
              >
                Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>GP51 Status</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
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
                      <DropdownMenuItem onClick={() => onEditUser(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAssignVehicles(user)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Vehicles
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {searchTerm ? 'No users found matching your search' : 'No users found'}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;
