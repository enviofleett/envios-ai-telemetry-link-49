
-- Create the main orders table (with correct column: buyer_id)
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  payment_reference TEXT UNIQUE,
  paystack_reference TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the order items table
CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id),
  merchant_id UUID NOT NULL REFERENCES public.marketplace_merchants(id),
  vehicle_ids TEXT[] NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row-level security
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;

-- Drop and create correct RLS policies

DROP POLICY IF EXISTS "Users can view their orders" ON public.marketplace_orders;
CREATE POLICY "Users can view their orders"
  ON public.marketplace_orders
  FOR SELECT
  USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can create their own orders" ON public.marketplace_orders;
CREATE POLICY "Users can create their own orders"
  ON public.marketplace_orders
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update their own pending orders" ON public.marketplace_orders;
CREATE POLICY "Users can update their own pending orders"
  ON public.marketplace_orders
  FOR UPDATE
  USING (auth.uid() = buyer_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can delete their own pending orders" ON public.marketplace_orders;
CREATE POLICY "Users can delete their own pending orders"
  ON public.marketplace_orders
  FOR DELETE
  USING (auth.uid() = buyer_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can access all orders" ON public.marketplace_orders;
CREATE POLICY "Admins can access all orders"
  ON public.marketplace_orders
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Order items: users can see items in their own orders
DROP POLICY IF EXISTS "Users can view items in their orders" ON public.marketplace_order_items;
CREATE POLICY "Users can view items in their orders"
  ON public.marketplace_order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.marketplace_orders WHERE buyer_id = auth.uid()
    )
  );

-- Admins can view all order items
DROP POLICY IF EXISTS "Admins can view all order items" ON public.marketplace_order_items;
CREATE POLICY "Admins can view all order items"
  ON public.marketplace_order_items
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- (Optional) Add trigger to update 'updated_at' on order updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_marketplace_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_marketplace_orders_updated_at
      BEFORE UPDATE ON public.marketplace_orders
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
