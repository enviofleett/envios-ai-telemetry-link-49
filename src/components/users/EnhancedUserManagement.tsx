
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Filter, 
  Download,
  Users,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useOptimizedUserData } from '@/hooks/useOptimizedUserData';
import EnhancedUserTable from './EnhancedUserTable';
import UserStatsGrid from './UserStatsGrid';
import VehicleAssignmentModal from './VehicleAssignmentModal';
import CreateUserModal from './CreateUserModal';

const EnhancedUserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showVehicleAssignment, setShowVehicleAssignment] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'synced'>('all');

  const { data: usersData, isLoading, error, refetch } = useOptimizedUserData({
    page: currentPage,
    limit: 20,
    search: searchTerm,
    enabled: true
  });

  const users = usersData?.users || [];
  const pagination = usersData?.pagination;

  // Calculate stats
  const totalUsers = users.length;
  const syncedUsers = users.filter(u => u.gp51_username).length;
  const activeUsers = users.filter(u => u.registration_status === 'completed').length;
  const usersWithVehicles = users.filter(u => u.assigned_vehicles?.length > 0).length;

  const handleUserAction = (action: string, user: any) => {
    switch (action) {
      case 'assign-vehicles':
        setSelectedUser(user);
        setShowVehicleAssignment(true);
        break;
      case 'edit':
        // Handle edit user
        console.log('Edit user:', user.id);
        break;
      case 'sync-gp51':
        // Handle GP51 sync
        console.log('Sync GP51 for user:', user.id);
        break;
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    // Handle data export
    console.log('Export user data');
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <XCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
              <p className="text-sm">{error.message}</p>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users, GP51 integration, and vehicle assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateUser(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <UserStatsGrid
        totalUsers={totalUsers}
        syncedUsers={syncedUsers}
        activeUsers={activeUsers}
        usersWithVehicles={usersWithVehicles}
      />

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name, email, or GP51 username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="synced">GP51 Synced</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced User Table */}
      <EnhancedUserTable
        users={users}
        isLoading={isLoading}
        onUserAction={handleUserAction}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      {showCreateUser && (
        <CreateUserModal
          open={showCreateUser}
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => {
            setShowCreateUser(false);
            refetch();
          }}
        />
      )}

      {showVehicleAssignment && selectedUser && (
        <VehicleAssignmentModal
          open={showVehicleAssignment}
          onClose={() => {
            setShowVehicleAssignment(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSuccess={() => {
            setShowVehicleAssignment(false);
            setSelectedUser(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default EnhancedUserManagement;
