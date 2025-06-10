
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserPlus, Settings, Shield, Eye, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkshopPermission {
  id: string;
  workshop_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'technician' | 'inspector';
  permissions: string[];
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
  user?: {
    name: string;
    email: string;
  };
}

interface WorkshopPermissionsManagerProps {
  workshopId: string;
}

const WorkshopPermissionsManager: React.FC<WorkshopPermissionsManagerProps> = ({
  workshopId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<WorkshopPermission | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'manager' | 'technician' | 'inspector'>('technician');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const roleConfig = {
    owner: {
      label: 'Owner',
      icon: Shield,
      color: 'bg-red-100 text-red-800',
      defaultPermissions: ['manage_staff', 'manage_settings', 'view_transactions', 'manage_inspections', 'assign_inspectors']
    },
    manager: {
      label: 'Manager', 
      icon: Settings,
      color: 'bg-blue-100 text-blue-800',
      defaultPermissions: ['manage_staff', 'view_transactions', 'manage_inspections', 'assign_inspectors']
    },
    technician: {
      label: 'Technician',
      icon: Wrench,
      color: 'bg-green-100 text-green-800',
      defaultPermissions: ['view_inspections', 'update_inspections']
    },
    inspector: {
      label: 'Inspector',
      icon: Eye,
      color: 'bg-purple-100 text-purple-800',
      defaultPermissions: ['view_inspections', 'conduct_inspections', 'update_inspection_results']
    }
  };

  const allPermissions = [
    { id: 'manage_staff', label: 'Manage Staff', description: 'Add, remove, and modify staff permissions' },
    { id: 'manage_settings', label: 'Manage Settings', description: 'Modify workshop settings and configuration' },
    { id: 'view_transactions', label: 'View Transactions', description: 'Access financial transactions and payments' },
    { id: 'manage_inspections', label: 'Manage Inspections', description: 'Create and manage inspection templates' },
    { id: 'assign_inspectors', label: 'Assign Inspectors', description: 'Assign inspectors to inspection tasks' },
    { id: 'view_inspections', label: 'View Inspections', description: 'View inspection records and results' },
    { id: 'conduct_inspections', label: 'Conduct Inspections', description: 'Perform vehicle inspections' },
    { id: 'update_inspections', label: 'Update Inspections', description: 'Modify inspection records' },
    { id: 'update_inspection_results', label: 'Update Results', description: 'Update inspection results and reports' }
  ];

  // Fetch workshop permissions
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['workshop-permissions', workshopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_permissions')
        .select(`
          *,
          user:envio_users(name, email)
        `)
        .eq('workshop_id', workshopId)
        .eq('is_active', true);

      if (error) throw error;
      
      // Transform the data to match our interface
      return data?.map(item => ({
        id: item.id,
        workshop_id: item.workshop_id,
        user_id: item.user_id,
        role: item.role as 'owner' | 'manager' | 'technician' | 'inspector',
        permissions: Array.isArray(item.permissions) ? item.permissions : [],
        assigned_by: item.assigned_by,
        assigned_at: item.assigned_at,
        is_active: item.is_active,
        user: item.user && typeof item.user === 'object' && 'name' in item.user ? {
          name: item.user.name as string,
          email: item.user.email as string
        } : undefined
      })) as WorkshopPermission[];
    }
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async ({ email, role, permissions }: { 
      email: string; 
      role: string; 
      permissions: string[] 
    }) => {
      // First, find or create the user
      const { data: existingUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', email)
        .single();

      let userId = existingUser?.id;

      if (!existingUser) {
        // Create new user if doesn't exist
        const { data: newUser, error: userError } = await supabase
          .from('envio_users')
          .insert({
            email,
            name: email.split('@')[0],
            registration_type: 'workshop_staff',
            registration_status: 'pending'
          })
          .select()
          .single();

        if (userError) throw userError;
        userId = newUser.id;
      }

      // Get current user for assignment tracking
      const { data: currentUser } = await supabase.auth.getUser();
      
      // Add workshop permission
      const { data, error } = await supabase
        .from('workshop_permissions')
        .insert({
          workshop_id: workshopId,
          user_id: userId,
          role,
          permissions,
          assigned_by: currentUser.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-permissions', workshopId] });
      setShowAddUser(false);
      setNewUserEmail('');
      setNewUserRole('technician');
      setSelectedPermissions([]);
      toast({
        title: "User Added",
        description: "User has been successfully added to the workshop"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add user: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ permissionId, role, permissions }: {
      permissionId: string;
      role: string;
      permissions: string[];
    }) => {
      const { data, error } = await supabase
        .from('workshop_permissions')
        .update({ role, permissions })
        .eq('id', permissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-permissions', workshopId] });
      setSelectedUser(null);
      toast({
        title: "Permissions Updated",
        description: "User permissions have been updated successfully"
      });
    }
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from('workshop_permissions')
        .update({ is_active: false })
        .eq('id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-permissions', workshopId] });
      toast({
        title: "User Removed",
        description: "User has been removed from the workshop"
      });
    }
  });

  const handleRoleChange = (role: string) => {
    setNewUserRole(role as any);
    setSelectedPermissions(roleConfig[role as keyof typeof roleConfig].defaultPermissions);
  };

  const handleAddUser = () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive"
      });
      return;
    }

    addUserMutation.mutate({
      email: newUserEmail,
      role: newUserRole,
      permissions: selectedPermissions
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Workshop Staff Management
              </CardTitle>
              <CardDescription>
                Manage staff roles and permissions for this workshop
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddUser(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {permissions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staff members found. Add your first team member to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {permissions?.map((permission) => {
                const role = roleConfig[permission.role];
                const IconComponent = role.icon;
                
                return (
                  <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${role.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{permission.user?.name}</div>
                        <div className="text-sm text-muted-foreground">{permission.user?.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={role.color}>{role.label}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {permission.permissions.length} permissions
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(permission)}
                      >
                        Edit
                      </Button>
                      {permission.role !== 'owner' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeUserMutation.mutate(permission.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Add a new team member to your workshop
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="inspector">Inspector</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Permissions</Label>
              <div className="space-y-2 mt-2">
                {allPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPermissions([...selectedPermissions, permission.id]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label htmlFor={permission.id} className="text-sm font-medium">
                        {permission.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddUser(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={addUserMutation.isPending}>
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkshopPermissionsManager;
