
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, User, Mail, Calendar, Link2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EnvioUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  gp51_sessions: Array<{
    id: string;
    username: string;
    created_at: string;
    token_expires_at: string;
  }>;
}

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EnvioUser | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['envio-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('user-management');
      if (error) throw error;
      return data.users as EnvioUser[];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: userData
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envio-users'] });
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
      queryClient.invalidateQueries({ queryKey: ['envio-users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setFormData({ name: '', email: '' });
      toast({ title: 'User updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating user', description: error.message, variant: 'destructive' });
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
      queryClient.invalidateQueries({ queryKey: ['envio-users'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting user', description: error.message, variant: 'destructive' });
    },
  });

  const filteredUsers = usersData?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  const handleEditUser = (user: EnvioUser) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isSessionActive = (session: any) => {
    return new Date(session.token_expires_at) > new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteUserMutation.mutate(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                Created: {formatDate(user.created_at)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">GP51 Connections:</span>
                </div>
                {user.gp51_sessions && user.gp51_sessions.length > 0 ? (
                  <div className="space-y-1">
                    {user.gp51_sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between">
                        <span className="text-sm">{session.username}</span>
                        <Badge variant={isSessionActive(session) ? 'default' : 'secondary'}>
                          {isSessionActive(session) ? 'Active' : 'Expired'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No GP51 connections</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No users found</div>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
