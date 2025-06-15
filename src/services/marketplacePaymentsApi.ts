
import { supabase } from "@/integrations/supabase/client";
import { EscrowTransaction, PaymentDispute, WebhookEvent } from "@/types/marketplace-payments";

// Escrow: Create escrow transaction once a payment starts (before actual payment)
export async function createEscrowTransaction(dto: Omit<EscrowTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<EscrowTransaction | null> {
  const { data, error } = await supabase
    .from('marketplace_escrow_transactions')
    .insert(dto)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data as EscrowTransaction | null;
}

// Escrow: Get escrow transaction by order_id
export async function getEscrowTransactionByOrder(order_id: string): Promise<EscrowTransaction | null> {
  const { data, error } = await supabase
    .from('marketplace_escrow_transactions')
    .select('*')
    .eq('order_id', order_id)
    .maybeSingle();
  if (error) throw error;
  return data as EscrowTransaction | null;
}

// Dispute: Create a dispute for an escrow/payment
export async function createPaymentDispute(dto: Omit<PaymentDispute, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentDispute | null> {
  const { data, error } = await supabase
    .from('marketplace_payment_disputes')
    .insert(dto)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as PaymentDispute | null;
}

// Webhook event: For admin/audit display
export async function getWebhookEvents(limit = 20): Promise<WebhookEvent[]> {
  const { data, error } = await supabase
    .from('marketplace_webhook_events')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as WebhookEvent[]) || [];
}
