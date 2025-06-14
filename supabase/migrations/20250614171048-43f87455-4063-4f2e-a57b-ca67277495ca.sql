
-- 1. Merchants table
CREATE TABLE IF NOT EXISTS public.marketplace_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  org_name TEXT NOT NULL,
  email TEXT NOT NULL,
  registration_fee NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  approved BOOLEAN NOT NULL DEFAULT false,
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Products & categories
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.marketplace_merchants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.marketplace_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  price_unit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  connection_fee NUMERIC NOT NULL DEFAULT 0, -- per-vehicle connection fee
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Orders & transactions (purchases, fees, commissions)
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.marketplace_products(id),
  buyer_id UUID REFERENCES auth.users(id),
  vehicle_id TEXT, -- linked to fleet vehicle
  merchant_id UUID REFERENCES public.marketplace_merchants(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'fulfilled', 'cancelled'
  amount NUMERIC NOT NULL,
  connection_fee NUMERIC NOT NULL DEFAULT 0,
  commission_percent NUMERIC NOT NULL DEFAULT 0.10,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  merchant_payout NUMERIC NOT NULL DEFAULT 0,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Merchant registration/payout transactions
CREATE TABLE IF NOT EXISTS public.marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.marketplace_orders(id),
  merchant_id UUID REFERENCES public.marketplace_merchants(id),
  buyer_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'purchase', 'registration_fee', 'commission', 'payout'
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Service linkage (track which vehicle has what service)
CREATE TABLE IF NOT EXISTS public.vehicle_service_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT NOT NULL,
  buyer_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES public.marketplace_orders(id),
  product_id UUID REFERENCES public.marketplace_products(id),
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Merchant/customer communications (for support, onboarding, etc)
CREATE TABLE IF NOT EXISTS public.marketplace_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.marketplace_orders(id),
  merchant_id UUID REFERENCES public.marketplace_merchants(id),
  buyer_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'support', 'notification', 'onboarding'
  message TEXT,
  sent_via TEXT,  -- 'email', 'sms', 'in-app'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. RLS policies (ownership & security)
ALTER TABLE public.marketplace_merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merchants manage own data" ON public.marketplace_merchants
  USING (user_id = auth.uid());

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merchant can manage own products" ON public.marketplace_products
  USING (
    merchant_id IN (SELECT id FROM public.marketplace_merchants WHERE user_id = auth.uid())
  );

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buyer can view own orders" ON public.marketplace_orders
  USING (buyer_id = auth.uid());
CREATE POLICY "merchant can view their orders" ON public.marketplace_orders
  USING (merchant_id IN (SELECT id FROM public.marketplace_merchants WHERE user_id = auth.uid()));

ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "involved can see transaction" ON public.marketplace_transactions
  USING (
    merchant_id IN (SELECT id FROM public.marketplace_merchants WHERE user_id = auth.uid())
    OR buyer_id = auth.uid()
  );

ALTER TABLE public.vehicle_service_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buyer can see their service connections" ON public.vehicle_service_connections
  USING (buyer_id = auth.uid());

ALTER TABLE public.marketplace_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "involved can see communication" ON public.marketplace_communications
  USING (
    merchant_id IN (SELECT id FROM public.marketplace_merchants WHERE user_id = auth.uid())
    OR buyer_id = auth.uid()
  );
