import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { gp51UserApi } from '@/services/gp51UserManagementApi';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUser?: any;
}

interface CreateUserFormData {
  name: string;
  email: string;
  phone_number: string;
  role: 'user' | 'admin';
  gp51_user_type: 1 | 2 | 3 | 4;
  create_gp51_account: boolean;
  gp51_username: string;
  gp51_password: string;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onOpenChange, editUser }) => {
  const [formData, setFormData] = useState<CreateUserFormData>({
    name: '',
    email: '',
    phone_number: '',
    role: 'user',
    gp51_user_type: 3,
    create_gp51_account: false,
    gp51_username: '',
    gp51_password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Populate form data when editing a user
  useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name || '',
        email: editUser.email || '',
        phone_number: editUser.phone_number || '',
        role: editUser.role || 'user',
        gp51_user_type: editUser.gp51_user_type || 3,
        create_gp51_account: false, // Don't auto-check for edit mode
        gp51_username: editUser.gp51_username || '',
        gp51_password: ''
      });
    } else {
      resetForm();
    }
  }, [editUser]);

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormData) => {
      if (editUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('envio_users')
          .update({
            name: userData.name,
            phone_number: userData.phone_number,
            gp51_user_type: userData.gp51_user_type,
            gp51_username: userData.gp51_username || null
          })
          .eq('id', editUser.id);

        if (updateError) {
          throw new Error(`Failed to update user: ${updateError.message}`);
        }

        // Update role if changed
        const { error: roleError } = await supabase.functions.invoke(`user-management/${editUser.id}/role`, {
          body: { role: userData.role }
        });

        if (roleError) {
          console.error('Role update error:', roleError);
          // Don't throw here as user update was successful
        }

        return { user: editUser };
      } else {
        // Create user in Envio system
        const { data: envioUser, error: envioError } = await supabase.functions.invoke('user-management', {
          body: {
            name: userData.name,
            email: userData.email,
            phone_number: userData.phone_number
          }
        });

        if (envioError) {
          console.error('Envio user creation error:', envioError);
          throw new Error(`Failed to create user: ${envioError.message || 'Unknown error'}`);
        }

        if (!envioUser || !envioUser.user) {
          throw new Error('Failed to create user: No user data returned');
        }

        // Set user role
        const { error: roleError } = await supabase.functions.invoke(`user-management/${envioUser.user.id}/role`, {
          body: { role: userData.role }
        });

        if (roleError) {
          console.error('Role assignment error:', roleError);
          throw new Error(`Failed to assign role: ${roleError.message || 'Unknown error'}`);
        }

        // Create GP51 account if requested
        if (userData.create_gp51_account) {
          try {
            console.log('Creating GP51 account for:', userData.gp51_username);
            
            const gp51Response = await gp51UserApi.createUser({
              username: userData.gp51_username,
              password: userData.gp51_password,
              usertype: userData.gp51_user_type,
              creater: 'admin', // This should come from current user context
              multilogin: 1,
              showname: userData.name,
              email: userData.email
            });

            console.log('GP51 creation response:', gp51Response);

            if (gp51Response && gp51Response.status === 0) {
              // Update Envio user with GP51 information
              const { error: updateError } = await supabase
                .from('envio_users')
                .update({
                  gp51_username: userData.gp51_username,
                  gp51_user_type: userData.gp51_user_type,
                  is_gp51_imported: true
                })
                .eq('id', envioUser.user.id);

              if (updateError) {
                console.error('GP51 metadata update error:', updateError);
                // Don't throw here as user was created successfully
              }
            } else {
              console.error('GP51 account creation failed:', gp51Response);
              // Don't throw here, just show a warning toast
              toast({
                title: 'User created with warning',
                description: 'User was created but GP51 account creation failed. You can try creating the GP51 account later.',
                variant: 'destructive'
              });
            }
          } catch (gp51Error: any) {
            console.error('GP51 account creation failed:', gp51Error);
            // Don't throw here, just show a warning toast
            toast({
              title: 'User created with warning',
              description: 'User was created but GP51 account creation failed. You can try creating the GP51 account later.',
              variant: 'destructive'
            });
          }
        }

        return envioUser;
      }
    },
    onSuccess: () => {
      // Invalidate all user queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['users-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['users-enhanced'] });
      onOpenChange(false);
      resetForm();
      toast({ 
        title: editUser ? 'User updated successfully' : 'User created successfully',
        description: editUser ? 'The user information has been updated.' : 'The user has been created and can now access the system.'
      });
    },
    onError: (error: any) => {
      console.error('User operation mutation error:', error);
      toast({
        title: editUser ? 'Error updating user' : 'Error creating user',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      role: 'user',
      gp51_user_type: 3,
      create_gp51_account: false,
      gp51_username: '',
      gp51_password: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!editUser) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    }
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';

    if (formData.create_gp51_account && !editUser) {
      if (!formData.gp51_username.trim()) newErrors.gp51_username = 'GP51 username is required';
      if (!formData.gp51_password.trim()) newErrors.gp51_password = 'GP51 password is required';
      if (formData.gp51_password.length < 6) newErrors.gp51_password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createUserMutation.mutate(formData);
    }
  };

  const handleGP51UsernameGenerate = () => {
    const baseUsername = formData.name.toLowerCase().replace(/\s+/g, '');
    const randomSuffix = Math.floor(Math.random() * 1000);
    setFormData({ ...formData, gp51_username: `${baseUsername}${randomSuffix}` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Edit User' : 'Create New User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          {!editUser && (
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
          )}

          {editUser && (
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editUser.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          )}

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className={errors.phone_number ? 'border-red-500' : ''}
            />
            {errors.phone_number && <p className="text-sm text-red-500 mt-1">{errors.phone_number}</p>}
          </div>

          <div>
            <Label htmlFor="role">User Role</Label>
            <Select value={formData.role} onValueChange={(value: 'user' | 'admin') => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!editUser && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create_gp51"
                checked={formData.create_gp51_account}
                onCheckedChange={(checked) => setFormData({ ...formData, create_gp51_account: checked as boolean })}
              />
              <Label htmlFor="create_gp51">Create GP51 Account</Label>
            </div>
          )}

          {(formData.create_gp51_account || editUser) && (
            <>
              <div>
                <Label htmlFor="gp51_user_type">GP51 User Type</Label>
                <Select 
                  value={formData.gp51_user_type.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, gp51_user_type: parseInt(value) as 1 | 2 | 3 | 4 })}
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="gp51_username">GP51 Username {!editUser && '*'}</Label>
                  {!editUser && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGP51UsernameGenerate}
                    >
                      Generate
                    </Button>
                  )}
                </div>
                <Input
                  id="gp51_username"
                  value={formData.gp51_username}
                  onChange={(e) => setFormData({ ...formData, gp51_username: e.target.value })}
                  className={errors.gp51_username ? 'border-red-500' : ''}
                />
                {errors.gp51_username && <p className="text-sm text-red-500 mt-1">{errors.gp51_username}</p>}
              </div>

              {!editUser && (
                <div>
                  <Label htmlFor="gp51_password">GP51 Password *</Label>
                  <Input
                    id="gp51_password"
                    type="password"
                    value={formData.gp51_password}
                    onChange={(e) => setFormData({ ...formData, gp51_password: e.target.value })}
                    className={errors.gp51_password ? 'border-red-500' : ''}
                  />
                  {errors.gp51_password && <p className="text-sm text-red-500 mt-1">{errors.gp51_password}</p>}
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
              className="flex-1"
            >
              {createUserMutation.isPending ? (editUser ? 'Updating...' : 'Creating...') : (editUser ? 'Update User' : 'Create User')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
