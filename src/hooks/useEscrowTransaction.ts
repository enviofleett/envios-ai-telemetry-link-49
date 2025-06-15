
import { useQuery } from "@tanstack/react-query";
import { getEscrowTransactionByOrder } from "@/services/marketplacePaymentsApi";
import { EscrowTransaction } from "@/types/marketplace-payments";

// Fetch escrow tx for a specific order id
export function useEscrowTransaction(order_id: string | undefined) {
  return useQuery({
    queryKey: ['escrow-transaction', order_id],
    queryFn: () => order_id ? getEscrowTransactionByOrder(order_id) : null,
    enabled: !!order_id,
  });
}
