
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEscrowTransaction } from "@/services/marketplacePaymentsApi";
import { EscrowTransaction } from "@/types/marketplace-payments";

export function useMarketplaceEscrowCreate() {
  const queryClient = useQueryClient();
  // Example: invoked on payment initiation
  return useMutation({
    mutationFn: (dto: Omit<EscrowTransaction, 'id' | 'created_at' | 'updated_at'>) =>
      createEscrowTransaction(dto),
    onSuccess: (data) => {
      if (data?.order_id)
        queryClient.invalidateQueries({ queryKey: ['escrow-transaction', data.order_id] });
    },
  });
}
