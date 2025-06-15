
-- 1. ESCROW TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.marketplace_escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  merchant_id UUID NOT NULL REFERENCES public.marketplace_merchants(id),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, held, released, refunded, disputed
  paystack_reference TEXT,
  escrow_release_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. PAYMENT DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.marketplace_payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  escrow_transaction_id UUID NOT NULL REFERENCES public.marketplace_escrow_transactions(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  merchant_id UUID NOT NULL REFERENCES public.marketplace_merchants(id),
  status TEXT NOT NULL DEFAULT 'open', -- open, resolved, rejected
  reason TEXT,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. PAYSTACK (AND OTHER) WEBHOOK EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.marketplace_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- paystack, stripe, etc
  reference TEXT,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'received', -- received, processed, error
  error_message TEXT
);

-- 4. ENHANCE ORDERS TABLE FOR ESCROW TRACKING
ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'pending', -- pending, held, released, disputed, refunded
  ADD COLUMN IF NOT EXISTS escrow_transaction_id UUID REFERENCES public.marketplace_escrow_transactions(id),
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'; -- pending, completed, failed, refunded

-- 5. ENABLE RLS FOR THE NEW TABLES
ALTER TABLE public.marketplace_escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_webhook_events ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES
-- Escrow transactions: Buyer and Admin can select
DROP POLICY IF EXISTS "Buyer can view their escrow transactions" ON public.marketplace_escrow_transactions;
CREATE POLICY "Buyer can view their escrow transactions"
  ON public.marketplace_escrow_transactions
  FOR SELECT
  USING (auth.uid() = buyer_id OR public.has_role(auth.uid(), 'admin'));

-- Insert: Buyer can insert for their own order
DROP POLICY IF EXISTS "Buyer can create escrow tx for their order" ON public.marketplace_escrow_transactions;
CREATE POLICY "Buyer can create escrow tx for their order"
  ON public.marketplace_escrow_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Disputes: Buyer creates, both buyer/merchant/admin can view
DROP POLICY IF EXISTS "Buyer can create disputes" ON public.marketplace_payment_disputes;
CREATE POLICY "Buyer can create disputes"
  ON public.marketplace_payment_disputes
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Dispute stakeholders can view disputes" ON public.marketplace_payment_disputes;
CREATE POLICY "Dispute stakeholders can view disputes"
  ON public.marketplace_payment_disputes
  FOR SELECT
  USING (
    auth.uid() = buyer_id OR
    auth.uid() = merchant_id OR
    public.has_role(auth.uid(), 'admin')
  );

-- Webhook events: Admin only
DROP POLICY IF EXISTS "Admins can view webhook events" ON public.marketplace_webhook_events;
CREATE POLICY "Admins can view webhook events"
  ON public.marketplace_webhook_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

