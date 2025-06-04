
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  user_roles?: Array<{ role: string }>;
}

export const useUserManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: userData
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-vehicle-counts'] });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', email: '' });
      toast({ title: 'User created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating user', description: error.message, variant: 'destructive' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: { name: string; email: string } }) => {
      const { data, error } = await supabase.functions.invoke(`user-management/${id}`, {
        body: userData
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setFormData({ name: '', email: '' });
      toast({ title: 'User updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating user', description: error.message, variant: 'destructive' });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.functions.invoke(`user-management/${userId}/role`, {
        body: { role }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-users'] });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      toast({ title: 'User role updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating user role', description: error.message, variant: 'destructive' });
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
      queryClient.invalidateQueries({ queryKey: ['enhanced-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-vehicle-counts'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting user', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, userData: formData });
    }
  };

  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: selectedRole });
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email });
    setIsEditDialogOpen(true);
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.user_roles?.[0]?.role || 'user');
    setIsRoleDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  return {
    // Dialog states
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isRoleDialogOpen,
    setIsRoleDialogOpen,
    
    // Form data
    formData,
    setFormData,
    selectedRole,
    setSelectedRole,
    selectedUser,
    
    // Mutations
    createUserMutation,
    updateUserMutation,
    updateRoleMutation,
    deleteUserMutation,
    
    // Handlers
    handleCreateUser,
    handleUpdateUser,
    handleUpdateRole,
    handleEditUser,
    handleEditRole,
    handleDeleteUser
  };
};
