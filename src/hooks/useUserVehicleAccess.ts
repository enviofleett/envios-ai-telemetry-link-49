
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserVehicleAccess {
  hasAccess: boolean;
  vehicleCount: number;
  assignedVehicles: string[];
  canViewAllVehicles: boolean;
  userRole: string;
}

export const useUserVehicleAccess = () => {
  const { user } = useAuth();
  const [accessInfo, setAccessInfo] = useState<UserVehicleAccess>({
    hasAccess: false,
    vehicleCount: 0,
    assignedVehicles: [],
    canViewAllVehicles: false,
    userRole: 'user'
  });

  // Get current user's Envio profile and role
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: profile, error: profileError } = await supabase
        .from('envio_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      return profile;
    },
    enabled: !!user?.id,
  });

  // Get user role
  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return 'user';

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        return 'user';
      }

      return roleData?.role || 'user';
    },
    enabled: !!user?.id,
  });

  // Get user's assigned vehicles
  const { data: assignedVehicles } = useQuery({
    queryKey: ['user-vehicles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('device_id, device_name, status')
        .eq('envio_user_id', user.id)
        .eq('is_active', true);

      if (vehiclesError) {
        console.error('Error fetching user vehicles:', vehiclesError);
        return [];
      }

      return vehicles || [];
    },
    enabled: !!user?.id,
  });

  // Update access info when data changes
  useEffect(() => {
    const isAdmin = userRole === 'admin';
    const vehicleIds = assignedVehicles?.map(v => v.device_id) || [];
    
    setAccessInfo({
      hasAccess: isAdmin || vehicleIds.length > 0,
      vehicleCount: vehicleIds.length,
      assignedVehicles: vehicleIds,
      canViewAllVehicles: isAdmin,
      userRole: userRole || 'user'
    });

    // Log access info for debugging
    console.log('User vehicle access updated:', {
      userId: user?.id,
      isAdmin,
      vehicleCount: vehicleIds.length,
      canViewAll: isAdmin
    });

  }, [user?.id, userRole, assignedVehicles]);

  const verifyVehicleAccess = (deviceId: string): boolean => {
    if (accessInfo.canViewAllVehicles) return true;
    return accessInfo.assignedVehicles.includes(deviceId);
  };

  const getAccessibleVehicles = (allVehicles: any[]): any[] => {
    if (accessInfo.canViewAllVehicles) return allVehicles;
    return allVehicles.filter(vehicle => 
      accessInfo.assignedVehicles.includes(vehicle.device_id)
    );
  };

  return {
    ...accessInfo,
    userProfile,
    verifyVehicleAccess,
    getAccessibleVehicles,
    isLoading: !user?.id || !userRole || assignedVehicles === undefined
  };
};
