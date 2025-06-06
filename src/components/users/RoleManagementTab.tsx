
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Settings, Eye, Edit, Trash2 } from 'lucide-react';

interface RolePermission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserRole {
  userId: string;
  userName: string;
  userEmail: string;
  role: 'admin' | 'user';
  assignedAt: string;
  assignedBy: string;
}

const PERMISSIONS: RolePermission[] = [
  { id: 'users.view', name: 'View Users', description: 'Can view user list and details', category: 'Users' },
  { id: 'users.create', name: 'Create Users', description: 'Can create new users', category: 'Users' },
  { id: 'users.edit', name: 'Edit Users', description: 'Can modify user information', category: 'Users' },
  { id: 'users.delete', name: 'Delete Users', description: 'Can delete users', category: 'Users' },
  { id: 'vehicles.view', name: 'View Vehicles', description: 'Can view vehicle list and details', category: 'Vehicles' },
  { id: 'vehicles.assign', name: 'Assign Vehicles', description: 'Can assign vehicles to users', category: 'Vehicles' },
  { id: 'system.admin', name: 'System Administration', description: 'Full system access', category: 'System' },
];

const ROLE_PERMISSIONS = {
  admin: ['users.view', 'users.create', 'users.edit', 'users.delete', 'vehicles.view', 'vehicles.assign', 'system.admin'],
  user: ['vehicles.view']
};

const RoleManagementTab: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [userRoles, setUserRoles] = useState<UserRole[]>([
    {
      userId: '1',
      userName: 'chudesyl',
      userEmail: 'chudesyl@gmail.com',
      role: 'admin',
      assignedAt: '2024-01-15T10:30:00Z',
      assignedBy: 'System'
    }
  ]);
  const { toast } = useToast();

  const handleRoleChange = (userId: string, newRole: 'admin' | 'user') => {
    setUserRoles(prev => prev.map(userRole => 
      userRole.userId === userId 
        ? { ...userRole, role: newRole, assignedAt: new Date().toISOString(), assignedBy: 'Current User' }
        : userRole
    ));
    toast({
      title: 'Role Updated',
      description: `User role changed to ${newRole}`
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'user': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Users': return <Users className="w-4 h-4" />;
      case 'Vehicles': return <Settings className="w-4 h-4" />;
      case 'System': return <Shield className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRoles.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRoles.filter(u => u.role === 'admin').length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRoles.filter(u => u.role === 'user').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Role Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">View permissions for role:</label>
              <Select value={selectedRole} onValueChange={(value: 'admin' | 'user') => setSelectedRole(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(
                PERMISSIONS.reduce((acc, permission) => {
                  if (!acc[permission.category]) acc[permission.category] = [];
                  acc[permission.category].push(permission);
                  return acc;
                }, {} as Record<string, RolePermission[]>)
              ).map(([category, permissions]) => (
                <Card key={category} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {getCategoryIcon(category)}
                    <h4 className="font-semibold">{category}</h4>
                  </div>
                  <div className="space-y-2">
                    {permissions.map(permission => (
                      <div key={permission.id} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{permission.name}</div>
                          <div className="text-xs text-gray-500">{permission.description}</div>
                        </div>
                        <Badge 
                          variant={ROLE_PERMISSIONS[selectedRole].includes(permission.id) ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {ROLE_PERMISSIONS[selectedRole].includes(permission.id) ? "✓" : "✗"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Role Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map((userRole) => (
                <TableRow key={userRole.userId}>
                  <TableCell className="font-medium">{userRole.userName}</TableCell>
                  <TableCell>{userRole.userEmail}</TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(userRole.role)}>
                      {userRole.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(userRole.assignedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{userRole.assignedBy}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={userRole.role} 
                        onValueChange={(value: 'admin' | 'user') => handleRoleChange(userRole.userId, value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagementTab;
