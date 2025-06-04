
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnhancedUserData } from '@/hooks/useEnhancedUserData';
import { useUserManagement } from '@/hooks/useUserManagement';
import UserStatistics from '@/components/users/UserStatistics';
import UserFilters from '@/components/users/UserFilters';
import UserGrid from '@/components/users/UserGrid';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import EditUserDialog from '@/components/users/EditUserDialog';
import EditRoleDialog from '@/components/users/EditRoleDialog';
import Layout from '@/components/Layout';

const EnhancedUserManagement = () => {
  const {
    users,
    filteredUsers,
    vehicleCounts,
    statistics,
    filters,
    setFilters,
    isLoading,
    error,
    refetch,
    currentUser
  } = useEnhancedUserData();

  const {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isRoleDialogOpen,
    setIsRoleDialogOpen,
    formData,
    setFormData,
    selectedRole,
    setSelectedRole,
    createUserMutation,
    updateUserMutation,
    updateRoleMutation,
    handleCreateUser,
    handleUpdateUser,
    handleUpdateRole,
    handleEditUser,
    handleEditRole,
    handleDeleteUser
  } = useUserManagement();

  const handleRefresh = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      source: 'all',
      status: 'all',
      role: 'all'
    });
  };

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error loading users</div>
            <Button onClick={handleRefresh}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage Envio users and their GP51 connections</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <CreateUserDialog
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              formData={formData}
              onFormDataChange={setFormData}
              onSubmit={handleCreateUser}
              isLoading={createUserMutation.isPending}
            />
          </div>
        </div>

        {/* User Statistics Summary */}
        <UserStatistics statistics={statistics} />

        {/* Filters */}
        <UserFilters
          filters={filters}
          onFiltersChange={setFilters}
          userCount={users.length}
          filteredCount={filteredUsers.length}
        />

        {/* User Grid */}
        <UserGrid
          isLoading={isLoading}
          filteredUsers={filteredUsers}
          users={users}
          vehicleCounts={vehicleCounts}
          currentUserId={currentUser?.id}
          onEditUser={handleEditUser}
          onEditRole={handleEditRole}
          onDeleteUser={handleDeleteUser}
          onClearFilters={handleClearFilters}
        />

        {/* Edit User Dialog */}
        <EditUserDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleUpdateUser}
          isLoading={updateUserMutation.isPending}
        />

        {/* Edit Role Dialog */}
        <EditRoleDialog
          isOpen={isRoleDialogOpen}
          onOpenChange={setIsRoleDialogOpen}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          onSubmit={handleUpdateRole}
          isLoading={updateRoleMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default EnhancedUserManagement;
