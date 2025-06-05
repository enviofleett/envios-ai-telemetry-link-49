
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Shield, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { gp51UserApi } from '@/services/gp51UserManagementApi';
import { CreateUserRequest, EditUserRequest } from '@/types/gp51-user';

const GP51UserManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<CreateUserRequest>>({
    usertype: 3,
    multilogin: 1,
    creater: 'admin' // This should come from current user context
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['gp51-users'],
    queryFn: async () => {
      // This would need to be implemented to fetch all users
      // For now, return empty array as GP51 doesn't have a "list all users" endpoint
      return [];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserRequest) => gp51UserApi.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp51-users'] });
      setIsCreateDialogOpen(false);
      setFormData({ usertype: 3, multilogin: 1, creater: 'admin' });
      toast({ title: 'User created successfully in GP51' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error creating user', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (usernames: string[]) => gp51UserApi.deleteUsers(usernames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp51-users'] });
      toast({ title: 'User deleted successfully from GP51' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting user', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast({ title: 'Username and password are required', variant: 'destructive' });
      return;
    }
    createUserMutation.mutate(formData as CreateUserRequest);
  };

  const handleDeleteUser = (username: string) => {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      deleteUserMutation.mutate([username]);
    }
  };

  const getUserTypeIcon = (usertype: 1 | 2 | 3 | 4) => {
    switch (usertype) {
      case 1: return <Building2 className="h-4 w-4" />;
      case 2: return <Shield className="h-4 w-4" />;
      case 3: return <User className="h-4 w-4" />;
      case 4: return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getUserTypeBadgeVariant = (usertype: 1 | 2 | 3 | 4) => {
    switch (usertype) {
      case 1: return 'default';
      case 2: return 'secondary';
      case 3: return 'outline';
      case 4: return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GP51 User Management</h2>
          <p className="text-gray-600 mt-1">Manage GP51 user accounts and hierarchy</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create GP51 User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New GP51 User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="showname">Display Name</Label>
                <Input
                  id="showname"
                  value={formData.showname || ''}
                  onChange={(e) => setFormData({ ...formData, showname: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="usertype">User Type</Label>
                <Select 
                  value={formData.usertype?.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, usertype: parseInt(value) as 1 | 2 | 3 | 4 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Company Admin</SelectItem>
                    <SelectItem value="2">Sub Admin</SelectItem>
                    <SelectItem value="3">End User</SelectItem>
                    <SelectItem value="4">Device User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="companyname">Company Name</Label>
                <Input
                  id="companyname"
                  value={formData.companyname || ''}
                  onChange={(e) => setFormData({ ...formData, companyname: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="multilogin"
                  checked={formData.multilogin === 1}
                  onCheckedChange={(checked) => setFormData({ ...formData, multilogin: checked ? 1 : 0 })}
                />
                <Label htmlFor="multilogin">Allow Multi-login</Label>
              </div>
              <Button type="submit" disabled={createUserMutation.isPending} className="w-full">
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users && users.length > 0 ? users.map((user: any) => (
          <Card key={user.username} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    {getUserTypeIcon(user.usertype)}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {user.showname || user.username}
                      <Badge variant={getUserTypeBadgeVariant(user.usertype)} className="text-xs">
                        {gp51UserApi.getUserTypeLabel(user.usertype)}
                      </Badge>
                    </CardTitle>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteUser(user.username)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.email && (
                <div className="text-sm text-gray-600">
                  <strong>Email:</strong> {user.email}
                </div>
              )}
              {user.companyname && (
                <div className="text-sm text-gray-600">
                  <strong>Company:</strong> {user.companyname}
                </div>
              )}
              <div className="text-sm text-gray-600">
                <strong>Multi-login:</strong> {user.multilogin ? 'Allowed' : 'Not Allowed'}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Created by:</strong> {user.creater}
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 mb-4">
              No GP51 users found. Create your first user to get started.
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First User
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default GP51UserManagement;
