
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { VehicleData } from '@/types/vehicle';

interface VehicleAccess {
  vehicleId: string;
  userId: string;
  accessLevel: 'read' | 'write' | 'admin';
  grantedAt: string;
  grantedBy: string;
}

export const useUserVehicleAccess = (userId?: string) => {
  const [accessLevel, setAccessLevel] = useState<'read' | 'write' | 'admin'>('read');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vehicles accessible to user using correct column names
  const { data: accessibleVehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-vehicle-access', userId],
    queryFn: async (): Promise<VehicleData[]> => {
      if (!userId) return [];
      
      console.log('Fetching accessible vehicles for user:', userId);
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id, sim_number, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user vehicles:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Transform database records to VehicleData
      return data.map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        device_name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        status: 'offline' as const,
        is_active: true,
        isOnline: false,
        isMoving: false,
        alerts: [],
        lastUpdate: new Date(vehicle.updated_at),
      }));
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  // Get all available vehicles for assignment
  const { data: availableVehicles = [] } = useQuery({
    queryKey: ['available-vehicles'],
    queryFn: async (): Promise<VehicleData[]> => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id, sim_number, created_at, updated_at')
        .is('user_id', null)
        .order('name');

      if (error) {
        console.error('Error fetching available vehicles:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      return data.map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        device_name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        status: 'offline' as const,
        is_active: true,
        isOnline: false,
        isMoving: false,
        alerts: [],
        lastUpdate: new Date(vehicle.updated_at),
      }));
    },
  });

  // Grant access to vehicle
  const grantAccessMutation = useMutation({
    mutationFn: async ({ vehicleId, targetUserId }: { vehicleId: string; targetUserId: string }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: targetUserId })
        .eq('id', vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vehicle access granted successfully' });
      queryClient.invalidateQueries({ queryKey: ['user-vehicle-access'] });
      queryClient.invalidateQueries({ queryKey: ['available-vehicles'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: `Failed to grant access: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Revoke access from vehicle
  const revokeAccessMutation = useMutation({
    mutationFn: async ({ vehicleId }: { vehicleId: string }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: null })
        .eq('id', vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vehicle access revoked successfully' });
      queryClient.invalidateQueries({ queryKey: ['user-vehicle-access'] });
      queryClient.invalidateQueries({ queryKey: ['available-vehicles'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: `Failed to revoke access: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Check if user has access to specific vehicle
  const hasAccess = (vehicleId: string): boolean => {
    return accessibleVehicles.some(vehicle => vehicle.id === vehicleId);
  };

  // Get access level for specific vehicle
  const getAccessLevel = (vehicleId: string): 'none' | 'read' | 'write' | 'admin' => {
    if (!hasAccess(vehicleId)) return 'none';
    return accessLevel; // Could be enhanced to have per-vehicle access levels
  };

  return {
    accessibleVehicles,
    availableVehicles,
    isLoading,
    error: error?.message || null,
    refetch,
    accessLevel,
    setAccessLevel,
    grantAccess: grantAccessMutation.mutate,
    revokeAccess: revokeAccessMutation.mutate,
    hasAccess,
    getAccessLevel,
    isGranting: grantAccessMutation.isPending,
    isRevoking: revokeAccessMutation.isPending,
  };
};
