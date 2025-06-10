
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkshopUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'technician' | 'inspector';
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

interface WorkshopPermissionsManagerProps {
  workshopId: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_staff', label: 'Manage Staff', description: 'Add, edit, and remove staff members' },
  { id: 'manage_settings', label: 'Manage Settings', description: 'Update workshop settings and configuration' },
  { id: 'view_transactions', label: 'View Transactions', description: 'Access financial transactions and reports' },
  { id: 'manage_inspections', label: 'Manage Inspections', description: 'Create and schedule inspections' },
  { id: 'assign_inspectors', label: 'Assign Inspectors', description: 'Assign inspectors to vehicles and tasks' },
  { id: 'view_inspections', label: 'View Inspections', description: 'View inspection reports and data' },
  { id: 'conduct_inspections', label: 'Conduct Inspections', description: 'Perform vehicle inspections' },
  { id: 'update_inspections', label: 'Update Inspections', description: 'Edit inspection details' },
  { id: 'update_inspection_results', label: 'Update Results', description: 'Modify inspection results and scores' }
];

const ROLE_DEFAULTS = {
  owner: ['manage_staff', 'manage_settings', 'view_transactions', 'manage_inspections', 'assign_inspectors', 'view_inspections'],
  manager: ['manage_inspections', 'assign_inspectors', 'view_inspections', 'view_transactions'],
  technician: ['conduct_inspections', 'update_inspections', 'view_inspections'],
  inspector: ['conduct_inspections', 'view_inspections', 'update_inspection_results']
};

const WorkshopPermissionsManager: React.FC<WorkshopPermissionsManagerProps> = ({
  workshopId
}) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<WorkshopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'inspector' as WorkshopUser['role'],
    permissions: [] as string[]
  });

  useEffect(() => {
    loadWorkshopUsers();
  }, [workshopId]);

  const loadWorkshopUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('workshop_users')
        .select('*')
        .eq('workshop_id', workshopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast the database data to match our interface types
      const typedUsers: WorkshopUser[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: (user.role as 'owner' | 'manager' | 'technician' | 'inspector') || 'inspector',
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        is_active: user.is_active,
        created_at: user.created_at
      }));
      
      setUsers(typedUsers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load workshop users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: WorkshopUser['role']) => {
    setNewUser({
      ...newUser,
      role,
      permissions: ROLE_DEFAULTS[role] || []
    });
  };

  const handlePermissionToggle = (permissionId: string) => {
    const updated = newUser.permissions.includes(permissionId)
      ? newUser.permissions.filter(p => p !== permissionId)
      : [...newUser.permissions, permissionId];
    
    setNewUser({ ...newUser, permissions: updated });
  };

  const addUser = async () => {
    if (!newUser.email || !newUser.name) {
      toast({
        title: "Validation Error",
        description: "Email and name are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workshop_users')
        .insert({
          workshop_id: workshopId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          permissions: newUser.permissions
        })
        .select()
        .single();

      if (error) throw error;

      // Cast the returned data to match our interface
      const typedUser: WorkshopUser = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: (data.role as 'owner' | 'manager' | 'technician' | 'inspector') || 'inspector',
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        is_active: data.is_active,
        created_at: data.created_at
      };

      setUsers([typedUser, ...users]);
      setNewUser({ email: '', name: '', role: 'inspector', permissions: [] });
      setIsAddingUser(false);

      toast({
        title: "User Added",
        description: `${newUser.name} has been added to the workshop`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to add user: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('workshop_users')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !isActive } : user
      ));

      toast({
        title: isActive ? "User Deactivated" : "User Activated",
        description: `User has been ${isActive ? 'deactivated' : 'activated'}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'technician': return 'bg-green-100 text-green-800';
      case 'inspector': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Staff Management</h2>
          <p className="text-muted-foreground">
            Manage workshop staff, roles, and permissions
          </p>
        </div>
        <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Workshop User</DialogTitle>
              <DialogDescription>
                Add a new staff member to your workshop
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inspector">Inspector</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={newUser.permissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                      />
                      <Label 
                        htmlFor={permission.id} 
                        className="text-sm font-normal cursor-pointer"
                        title={permission.description}
                      >
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddingUser(false)}>
                  Cancel
                </Button>
                <Button onClick={addUser}>
                  Add User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Staff Members</h3>
              <p className="text-muted-foreground">
                Add your first staff member to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                      {user.is_active ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{user.email}</p>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((permission) => {
                          const permissionInfo = AVAILABLE_PERMISSIONS.find(p => p.id === permission);
                          return (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permissionInfo?.label || permission}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                    >
                      {user.is_active ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkshopPermissionsManager;
