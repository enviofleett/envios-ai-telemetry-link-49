
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useOptimizedUserData } from '@/hooks/useOptimizedUserData';
import UserStatsCards from './UserStatsCards';
import SimpleUserManagementTable from './SimpleUserManagementTable';
import UserDetailsModal from './UserDetailsModal';
import CreateUserDialog from './CreateUserDialog';

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

const SimpleUserManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data: usersData, isLoading } = useOptimizedUserData({
    page: 1,
    limit: 1000, // Get all users for stats
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const users = usersData?.users || [];

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
      // TODO: Implement delete functionality
      console.log('Delete user:', user.id);
    }
  };

  const handleCreateUserClose = () => {
    setShowCreateUser(false);
    setEditUser(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[120px] bg-gray-very-light rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-very-light rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Cards */}
      <UserStatsCards
        totalUsers={totalUsers}
        usersWithVehicles={usersWithVehicles}
        pendingActivations={pendingActivations}
        userDistribution={userDistribution}
      />

      {/* User Management Table */}
      <SimpleUserManagementTable
        users={users}
        onAddUser={handleAddUser}
        onUserClick={handleUserClick}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
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

export default SimpleUserManagement;
