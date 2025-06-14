
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMarketplaceOrders = (userId: string | undefined | null) => {
  // User's marketplace orders
  return useQuery({
    queryKey: ['marketplace_orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select(`*, marketplace_products(*), vehicle_service_connections(*)`)
        .or(`buyer_id.eq.${userId},merchant_id.in.(select id from marketplace_merchants where user_id = ${userId})`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });
};
