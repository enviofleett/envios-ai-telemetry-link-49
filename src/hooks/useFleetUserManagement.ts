
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
        fleet_role: user.user_roles?.[0]?.role || 'user',
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
      const { data, error } = await supabase
        .from('fleet_user_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        return;
      }

      setInvitations(data || []);
    } catch (error) {
      console.error('Error in fetchInvitations:', error);
    }
  };

  const toggleRoleEnabled = async (roleId: string, enabled: boolean) => {
    try {
      setFleetRoles(prev => 
        prev.map(role => 
          role.id === roleId ? { ...role, enabled } : role
        )
      );

      // Note: This would typically be stored in a backend preferences table
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

      const { data, error } = await supabase
        .from('fleet_user_invitations')
        .insert({
          invited_by: user.id,
          ...invitation
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        throw error;
      }

      await fetchInvitations();
      
      toast({
        title: "Success",
        description: `Invitation sent to ${invitation.email}`,
      });

      return data;
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
      const { error } = await supabase
        .from('fleet_user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error cancelling invitation:', error);
        throw error;
      }

      await fetchInvitations();
      
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
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole
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
