
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FleetRole {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface FleetUser {
  id: string;
  name: string;
  email: string;
  fleet_role: string;
  gp51_access_level: string;
}

interface Invitation {
  id: string;
  full_name: string;
  email: string;
  fleet_role: string;
  gp51_access_level: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
}

export const useFleetUserManagement = () => {
  const [fleetRoles] = useState<FleetRole[]>([
    { id: '1', name: 'Fleet Manager', description: 'Full fleet management access', enabled: true },
    { id: '2', name: 'Operations Supervisor', description: 'Vehicle operations and tracking', enabled: true },
    { id: '3', name: 'Maintenance Coordinator', description: 'Vehicle maintenance and service', enabled: true },
    { id: '4', name: 'Driver Supervisor', description: 'Driver management and reports', enabled: false },
    { id: '5', name: 'Compliance Officer', description: 'Safety and regulatory compliance', enabled: true },
  ]);
  
  const [users] = useState<FleetUser[]>([
    { id: '1', name: 'John Smith', email: 'john@company.com', fleet_role: 'Fleet Manager', gp51_access_level: 'company-admin' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', fleet_role: 'Operations Supervisor', gp51_access_level: 'sub-admin' },
  ]);
  
  const [invitations, setInvitations] = useState<Invitation[]>([
    { id: '1', full_name: 'Mike Wilson', email: 'mike@company.com', fleet_role: 'Maintenance Coordinator', gp51_access_level: 'end-user', status: 'pending' },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const toggleRoleEnabled = async (roleId: string, enabled: boolean) => {
    // In a real app, this would update the database
    toast({
      title: enabled ? "Role enabled" : "Role disabled",
      description: `The role has been ${enabled ? 'enabled' : 'disabled'}.`
    });
  };

  const inviteUser = async (userData: { full_name: string; email: string; fleet_role: string; gp51_access_level: string }) => {
    setIsSaving(true);
    try {
      // In a real app, this would send an invitation
      const newInvitation: Invitation = {
        id: Date.now().toString(),
        ...userData,
        status: 'pending'
      };
      
      setInvitations(prev => [newInvitation, ...prev]);
      
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${userData.email}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    setInvitations(prev => prev.map(inv => 
      inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv
    ));
    
    toast({
      title: "Invitation cancelled",
      description: "The invitation has been cancelled."
    });
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    // In a real app, this would update the user's role
    toast({
      title: "Role updated",
      description: "User role has been updated successfully."
    });
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
    updateUserRole
  };
};
