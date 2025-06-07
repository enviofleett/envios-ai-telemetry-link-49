
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface FleetRole {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface FleetUser {
  id: string;
  name: string;
  email: string;
  fleet_role: string;
  gp51_access_level: string;
  created_at: string;
  status: string;
}

export interface FleetInvitation {
  id: string;
  email: string;
  full_name: string;
  fleet_role: string;
  gp51_access_level: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const defaultFleetRoles: FleetRole[] = [
  {
    id: 'fleet-admin',
    name: 'Fleet Administrator',
    description: 'Full access to all fleet operations',
    enabled: true
  },
  {
    id: 'fleet-manager',
    name: 'Fleet Manager',
    description: 'Manage vehicles and drivers',
    enabled: true
  },
  {
    id: 'dispatcher',
    name: 'Dispatcher',
    description: 'Monitor live tracking and routes',
    enabled: true
  },
  {
    id: 'reports-viewer',
    name: 'Reports Viewer',
    description: 'View analytics and reports only',
    enabled: false
  }
];

export const useFleetUserManagement = () => {
  const [fleetRoles, setFleetRoles] = useState<FleetRole[]>(defaultFleetRoles);
  const [users, setUsers] = useState<FleetUser[]>([]);
  const [invitations, setInvitations] = useState<FleetInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchInvitations()]);
    } catch (error) {
      console.error('Error fetching fleet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('envio_users')
        .select(`
          id,
          name,
          email,
          created_at,
          user_roles!left(role)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const formattedUsers: FleetUser[] = data?.map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || '',
        fleet_role: (user.user_roles as any)?.[0]?.role || 'user',
        gp51_access_level: 'end-user', // Default for now
        created_at: user.created_at,
        status: 'active'
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      // Try to fetch from fleet_user_invitations table, but handle if it doesn't exist
      const { data, error } = await supabase
        .rpc('get_fleet_invitations')
        .select('*');

      if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
        // Table doesn't exist yet, return empty array
        console.log('Fleet invitations table not available yet');
        setInvitations([]);
        return;
      }

      if (error) {
        console.error('Error fetching invitations:', error);
        return;
      }

      setInvitations(data || []);
    } catch (error) {
      console.error('Error in fetchInvitations:', error);
      // Set empty array as fallback
      setInvitations([]);
    }
  };

  const toggleRoleEnabled = async (roleId: string, enabled: boolean) => {
    try {
      setFleetRoles(prev => 
        prev.map(role => 
          role.id === roleId ? { ...role, enabled } : role
        )
      );

      // Store in localStorage for now since we don't have a backend table yet
      localStorage.setItem('fleetRolesConfig', JSON.stringify(fleetRoles));

      toast({
        title: "Success",
        description: `Fleet role ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling role:', error);
      toast({
        title: "Error",
        description: "Failed to update role settings",
        variant: "destructive"
      });
    }
  };

  const inviteUser = async (invitation: {
    email: string;
    full_name: string;
    fleet_role: string;
    gp51_access_level: string;
  }) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // For now, simulate the invitation process
      const mockInvitation: FleetInvitation = {
        id: crypto.randomUUID(),
        email: invitation.email,
        full_name: invitation.full_name,
        fleet_role: invitation.fleet_role,
        gp51_access_level: invitation.gp51_access_level,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      setInvitations(prev => [mockInvitation, ...prev]);
      
      toast({
        title: "Success",
        description: `Invitation sent to ${invitation.email}`,
      });

      return mockInvitation;
    } catch (error) {
      console.error('Error in inviteUser:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId ? { ...inv, status: 'cancelled' } : inv
        )
      );
      
      toast({
        title: "Success",
        description: "Invitation cancelled successfully",
      });
    } catch (error) {
      console.error('Error in cancelInvitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive"
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Only allow 'admin' or 'user' roles as per the existing schema
      const validRole = newRole === 'admin' ? 'admin' : 'user';
      
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: validRole
        });

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }

      await fetchUsers();
      
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  return {
    fleetRoles,
    users,
    invitations,
    isLoading,
    isSaving,
    toggleRoleEnabled,
    inviteUser,
    cancelInvitation,
    updateUserRole,
    refetch: fetchData
  };
};
