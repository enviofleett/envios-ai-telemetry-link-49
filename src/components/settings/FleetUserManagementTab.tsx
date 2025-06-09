
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFleetUserManagement } from '@/hooks/useFleetUserManagement';
import { UserPlus, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';

const FleetUserManagementTab: React.FC = () => {
  const { 
    fleetRoles, 
    users, 
    invitations, 
    isLoading, 
    isSaving, 
    toggleRoleEnabled, 
    inviteUser, 
    cancelInvitation,
    updateUserRole
  } = useFleetUserManagement();

  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    fleet_role: '',
    gp51_access_level: ''
  });
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const handleInviteUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.fleet_role || !newUser.gp51_access_level) {
      return;
    }

    try {
      await inviteUser(newUser);
      setNewUser({
        full_name: '',
        email: '',
        fleet_role: '',
        gp51_access_level: ''
      });
      setIsInviteDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fleet User Roles & Permissions</CardTitle>
          <CardDescription>Manage fleet operator roles and GPS51 user assignments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet User Roles & Permissions</CardTitle>
        <CardDescription>Manage fleet operator roles and GPS51 user assignments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Fleet Role Configuration</h4>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Fleet User</DialogTitle>
                  <DialogDescription>
                    Send an invitation to add a new user to your fleet management system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fleet-role">Fleet Role</Label>
                    <Select value={newUser.fleet_role} onValueChange={(value) => setNewUser({ ...newUser, fleet_role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fleet role" />
                      </SelectTrigger>
                      <SelectContent>
                        {fleetRoles.filter(role => role.enabled).map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gp51-access">GP51 Access Level</Label>
                    <Select value={newUser.gp51_access_level} onValueChange={(value) => setNewUser({ ...newUser, gp51_access_level: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select GP51 access level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company-admin">Company Admin</SelectItem>
                        <SelectItem value="sub-admin">Sub Admin</SelectItem>
                        <SelectItem value="end-user">End User</SelectItem>
                        <SelectItem value="device-user">Device User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteUser} disabled={isSaving}>
                    {isSaving ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {fleetRoles.map((role) => (
            <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{role.name}</h4>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
              <Switch 
                checked={role.enabled}
                onCheckedChange={(checked) => toggleRoleEnabled(role.id, checked)}
                disabled={isSaving}
              />
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Current Users */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Current Fleet Users</h4>
          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.fleet_role}</Badge>
                    <Badge variant="secondary">{user.gp51_access_level}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No users found. Invite users to get started.</p>
          )}
        </div>

        <Separator />

        {/* Pending Invitations */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Pending Invitations</h4>
          {invitations.length > 0 ? (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invitation.full_name}</p>
                      <p className="text-sm text-muted-foreground">{invitation.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(invitation.status)}
                    <Badge variant={invitation.status === 'pending' ? 'default' : 'secondary'}>
                      {invitation.status}
                    </Badge>
                    {invitation.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => cancelInvitation(invitation.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No pending invitations.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetUserManagementTab;
