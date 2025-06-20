import React, { useState } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import UserStatsCards from './UserStatsCards';
import SimpleUserManagementTable from './SimpleUserManagementTable';
import UserDetailsModal from './UserDetailsModal';
import CreateUserDialog from './CreateUserDialog';

// Local interface for this component's data structure
interface LocalUser {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  user_roles: Array<{ role: string }>;
  registration_status?: string;
  assigned_vehicles?: Array<{
    id: string;
    device_id?: string;
    status: string;
    last_update: string;
  }>;
}

// Type-safe role distribution interface
interface RoleDistribution {
  admin: number;
  fleet_manager: number;
  dispatcher: number;
  driver: number;
}

const SimpleUserManagement: React.FC = () => {
  const { user } = useUnifiedAuth();
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editUser, setEditUser] = useState<LocalUser | null>(null);

  // Use the new user profiles hook instead of the old optimized hook
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['envio-users-with-vehicles'],
    queryFn: async () => {
      const { data: users, error } = await supabase
        .from('envio_users')
        .select(`
          *,
          vehicles (id, gp51_device_id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching users and vehicles:", error);
        throw error;
      }

      // Transform to match the expected LocalUser interface
      const transformedUsers: LocalUser[] = (users || []).map(user => ({
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email,
        phone_number: user.phone_number,
        user_roles: [{ role: user.user_type || 'end_user' }], // Use new user_type
        registration_status: user.registration_status,
        assigned_vehicles: (user.vehicles || []).map(v => ({
          id: v.id,
          device_id: v.gp51_device_id, // Use correct field from new schema
          status: 'active', // Placeholder status
          last_update: new Date().toISOString()
        }))
      }));

      return { users: transformedUsers };
    }
  });

  if (error) {
    return <div>Error loading users: {(error as Error).message}</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const users: LocalUser[] = usersData?.users || [];

  // Calculate stats
  const totalUsers = users.length;
  const usersWithVehicles = users.filter(u => u.assigned_vehicles && u.assigned_vehicles.length > 0).length;
  const pendingActivations = users.filter(u => u.registration_status === 'pending').length;
  
  const userDistribution: RoleDistribution = {
    admin: users.filter(u => u.user_roles?.[0]?.role === 'admin').length,
    fleet_manager: users.filter(u => u.user_roles?.[0]?.role === 'fleet_manager').length,
    dispatcher: users.filter(u => u.user_roles?.[0]?.role === 'dispatcher').length,
    driver: users.filter(u => u.user_roles?.[0]?.role === 'driver').length,
  };

  const handleUserClick = (user: LocalUser) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleAddUser = () => {
    setEditUser(null);
    setShowCreateUser(true);
  };

  const handleEditUser = (user: LocalUser) => {
    setEditUser(user);
    setShowCreateUser(true);
    setShowUserDetails(false);
  };

  const handleDeleteUser = (user: LocalUser) => {
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
