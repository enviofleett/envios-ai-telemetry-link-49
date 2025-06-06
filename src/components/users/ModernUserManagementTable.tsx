
import React, { useState } from 'react';
import { Search, Filter, Plus, MoreHorizontal, Users, UserCheck, UserX, AlertCircle } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  user_roles: Array<{ role: string }>;
  registration_status?: string;
}

interface ModernUserManagementTableProps {
  users: User[];
  onAddUser: () => void;
  onUserClick: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

const ModernUserManagementTable: React.FC<ModernUserManagementTableProps> = ({
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
    const roleLabels = {
      'admin': 'Admin',
      'manager': 'Manager', 
      'operator': 'Operator',
      'driver': 'Driver',
      'user': 'User'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'operator': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'driver': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'user': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
        return { label: 'Active', className: 'badge-success' };
      case 'pending':
        return { label: 'Pending', className: 'badge-warning' };
      case 'inactive':
        return { label: 'Inactive', className: 'badge-error' };
      default:
        return { label: 'Active', className: 'badge-success' };
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

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="card-modern">
      {/* Modern Header */}
      <CardHeader className="card-header-modern">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            User Management
            <Badge variant="outline" className="ml-2 font-normal">
              {filteredUsers.length} users
            </Badge>
          </CardTitle>
          <Button
            onClick={onAddUser}
            className="btn-primary-modern"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>

      <CardContent className="card-content-modern space-y-4">
        {/* Enhanced Search and Filter */}
        <div className="mobile-stack">
          <div className="search-container-modern">
            <Search className="search-icon-modern" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-modern"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="btn-secondary-modern">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            {selectedUsers.length > 0 && (
              <Button variant="destructive" size="sm">
                Delete Selected ({selectedUsers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Modern Table - Desktop */}
        <div className="hidden md:block table-modern">
          <div className="table-header-modern">
            <div className="flex items-center h-12 px-6">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium text-muted-foreground">User</span>
              </div>
              <div className="flex-1 grid grid-cols-5 gap-4 ml-4">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <span className="text-sm font-medium text-muted-foreground">Phone</span>
                <span className="text-sm font-medium text-muted-foreground">Role</span>
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <span className="text-sm font-medium text-muted-foreground text-right">Actions</span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-border">
            {filteredUsers.map((user) => {
              const status = getStatusBadge(user.registration_status || 'active');
              const role = getUserRole(user);
              
              return (
                <div 
                  key={user.id} 
                  className="table-row-modern cursor-pointer"
                  onClick={() => onUserClick(user)}
                >
                  <div className="flex items-center h-16 px-6">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
                          <span className="text-sm font-semibold text-primary">
                            {getUserInitials(user.name)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-40">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-4 ml-4">
                      <span className="text-sm text-foreground truncate">{user.email}</span>
                      <span className="text-sm text-muted-foreground">{user.phone_number || '-'}</span>
                      <Badge className={`badge-modern ${getRoleColor(role.toLowerCase())} w-fit`}>
                        {role}
                      </Badge>
                      <Badge className={`badge-modern ${status.className} w-fit`}>
                        {status.label}
                      </Badge>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border border-border shadow-lg">
                            <DropdownMenuItem onClick={() => onUserClick(user)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditUser(user)}>
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteUser(user)}
                              className="text-destructive"
                            >
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3">
          {filteredUsers.map((user) => {
            const status = getStatusBadge(user.registration_status || 'active');
            const role = getUserRole(user);
            
            return (
              <Card 
                key={user.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-200 border border-border"
                onClick={() => onUserClick(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
                        <span className="text-sm font-semibold text-primary">
                          {getUserInitials(user.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.phone_number && (
                          <p className="text-xs text-muted-foreground">{user.phone_number}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border border-border shadow-lg">
                        <DropdownMenuItem onClick={() => onUserClick(user)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteUser(user)}
                          className="text-destructive"
                        >
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Badge className={`badge-modern ${getRoleColor(role.toLowerCase())} text-xs`}>
                      {role}
                    </Badge>
                    <Badge className={`badge-modern ${status.className} text-xs`}>
                      {status.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Get started by adding your first user'
              }
            </p>
            {!searchTerm && (
              <Button onClick={onAddUser} className="btn-primary-modern">
                <Plus className="w-4 h-4 mr-2" />
                Add First User
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernUserManagementTable;
