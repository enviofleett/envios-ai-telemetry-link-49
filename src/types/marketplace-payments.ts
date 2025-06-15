
// Types for escrow, payment dispute, and webhook event

export interface EscrowTransaction {
  id: string;
  order_id: string;
  buyer_id: string;
  merchant_id: string;
  amount: number;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
  paystack_reference?: string;
  escrow_release_at?: string | null;
  released_at?: string | null;
  reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentDispute {
  id: string;
  order_id: string;
  escrow_transaction_id: string;
  buyer_id: string;
  merchant_id: string;
  status: 'open' | 'resolved' | 'rejected';
  reason?: string | null;
  resolution?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  reference?: string | null;
  event: string;
  payload: Record<string, any>;
  received_at: string;
  processed_at?: string | null;
  status: 'received' | 'processed' | 'error';
  error_message?: string | null;
}
