import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { gp51UserApi } from '@/services/gp51UserManagementApi';
import { validateUserForm, generateGP51Username } from '../utils/userFormValidation';

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

interface UseCreateUserFormProps {
  editUser?: any;
  onSuccess: () => void;
}

export const useCreateUserForm = ({ editUser, onSuccess }: UseCreateUserFormProps) => {
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
        create_gp51_account: false,
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

        // Create GP51 account if requested (with updated error handling)
        if (userData.create_gp51_account) {
          try {
            console.log('Creating GP51 account for:', userData.gp51_username);
            
            const gp51Response = await gp51UserApi.createUser({
              username: userData.gp51_username,
              password: userData.gp51_password,
              usertype: userData.gp51_user_type,
              creater: 'admin',
              multilogin: 1,
              showname: userData.name,
              email: userData.email
            });

            console.log('GP51 creation response:', gp51Response);

            // GP51 service is currently unavailable, so we expect failure
            toast({
              title: 'User created with note',
              description: 'User was created successfully. GP51 account creation is temporarily unavailable while the service is being rebuilt.',
              variant: 'default'
            });
          } catch (gp51Error: any) {
            console.error('GP51 account creation failed (expected):', gp51Error);
            toast({
              title: 'User created with note',
              description: 'User was created successfully. GP51 account creation is temporarily unavailable while the service is being rebuilt.',
              variant: 'default'
            });
          }
        }

        return envioUser;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['users-enhanced'] });
      onSuccess();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { errors: validationErrors, isValid } = validateUserForm(formData, !!editUser);
    setErrors(validationErrors);
    
    if (isValid) {
      createUserMutation.mutate(formData);
    }
  };

  const handleGP51UsernameGenerate = () => {
    const newUsername = generateGP51Username(formData.name);
    setFormData({ ...formData, gp51_username: newUsername });
  };

  return {
    formData,
    setFormData,
    errors,
    isLoading: createUserMutation.isPending,
    handleSubmit,
    handleGP51UsernameGenerate,
    isEdit: !!editUser
  };
};
