
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EnvioUser } from '@/types/owner';

export const useOwners = () => {
  return useQuery({
    queryKey: ['vehicle-owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('envio_users')
        .select(`
          id,
          name,
          email,
          phone_number,
          city,
          gp51_username,
          gp51_user_type,
          registration_status,
          created_at,
          updated_at
        `)
        .eq('registration_status', 'approved')
        .order('name');

      if (error) {
        console.error('Failed to fetch owners:', error);
        throw error;
      }

      return (data || []) as EnvioUser[];
    },
    refetchInterval: 30000,
  });
};
