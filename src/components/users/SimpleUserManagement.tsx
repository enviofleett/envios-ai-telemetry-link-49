
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
    device_id?: string;
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

  // Use the new user profiles hook instead of the old optimized hook
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['legacy-user-data'],
    queryFn: async () => {
      // Fetch from user_profiles table instead of envio_users
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          vehicles!vehicles_user_profile_id_fkey(id, device_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get email addresses from auth.users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const emailMap = authUsers.users.reduce((acc, user) => {
        acc[user.id] = user.email;
        return acc;
      }, {} as Record<string, string>);

      // Transform to match the expected User interface
      const transformedUsers = (profiles || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
        email: emailMap[profile.id] || '',
        phone_number: profile.phone_number,
        user_roles: [{ role: profile.role }],
        registration_status: profile.registration_status,
        assigned_vehicles: (profile.vehicles || []).map(v => ({
          id: v.id,
          device_id: v.device_id,
          status: 'active',
          last_update: new Date().toISOString()
        }))
      }));

      return { users: transformedUsers };
    }
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
    fleet_manager: users.filter(u => u.user_roles?.[0]?.role === 'fleet_manager').length,
    dispatcher: users.filter(u => u.user_roles?.[0]?.role === 'dispatcher').length,
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
