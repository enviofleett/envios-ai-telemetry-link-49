
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEnhancedUserData } from '@/hooks/useEnhancedUserData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SystemHealthIndicator from '@/components/admin/SystemHealthIndicator';
import UserStatsCards from './UserStatsCards';
import SimpleUserManagementTable from './SimpleUserManagementTable';
import UserDetailsModal from './UserDetailsModal';
import CreateUserDialog from './CreateUserDialog';
import { Search, RefreshCw, AlertTriangle, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  user_roles: Array<{ role: string }>;
  registration_status?: string;
  assigned_vehicles?: Array<{
    id: string;
    plate_number?: string;
    status: string;
    last_update: string;
  }>;
}

const EnhancedUserManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { 
    data: usersResponse, 
    isLoading, 
    error, 
    refetch 
  } = useEnhancedUserData({
    page: currentPage,
    limit: 50,
    search: searchTerm,
    bypassCache: false
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const users = usersResponse?.users || [];
  const metadata = usersResponse?.metadata;
  
  // Calculate stats
  const totalUsers = users.length;
  const usersWithVehicles = users.filter(u => u.assigned_vehicles && u.assigned_vehicles.length > 0).length;
  const pendingActivations = users.filter(u => u.registration_status === 'pending').length;
  
  const userDistribution = {
    admin: users.filter(u => u.user_roles?.[0]?.role === 'admin').length,
    manager: users.filter(u => u.user_roles?.[0]?.role === 'manager').length,
    operator: users.filter(u => u.user_roles?.[0]?.role === 'operator').length,
    driver: users.filter(u => u.user_roles?.[0]?.role === 'driver').length,
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleAddUser = () => {
    setEditUser(null);
    setShowCreateUser(true);
  };

  const handleEditUser = (user: User) => {
    setEditUser(user);
    setShowCreateUser(true);
    setShowUserDetails(false);
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      console.log('Delete user:', user.id);
    }
  };

  const handleCreateUserClose = () => {
    setShowCreateUser(false);
    setEditUser(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div className="space-y-6">
      {/* System Health Indicator */}
      <SystemHealthIndicator />

      {/* Enhanced Header with Search and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Enhanced User Management
              {metadata && (
                <Badge variant={metadata.cacheStatus === 'error' ? 'destructive' : 'secondary'}>
                  {metadata.cacheStatus}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button onClick={handleAddUser}>
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            {metadata && (
              <div className="text-sm text-gray-500">
                Last updated: {metadata.lastFetch.toLocaleTimeString()}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load user data. Please check system connectivity and try again.
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {metadata?.errorCount > 0 && !error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some data may be incomplete due to connectivity issues. 
                Showing cached results where available.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* User Stats Cards */}
      <UserStatsCards
        totalUsers={totalUsers}
        usersWithVehicles={usersWithVehicles}
        pendingActivations={pendingActivations}
        userDistribution={userDistribution}
      />

      {/* Enhanced User Management Table */}
      <SimpleUserManagementTable
        users={users}
        onAddUser={handleAddUser}
        onUserClick={handleUserClick}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        isLoading={isLoading}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        open={showUserDetails}
        onOpenChange={setShowUserDetails}
        user={selectedUser}
        onEditUser={handleEditUser}
      />

      {/* Create/Edit User Dialog */}
      <CreateUserDialog
        open={showCreateUser}
        onOpenChange={handleCreateUserClose}
        editUser={editUser}
      />
    </div>
  );
};

export default EnhancedUserManagement;
