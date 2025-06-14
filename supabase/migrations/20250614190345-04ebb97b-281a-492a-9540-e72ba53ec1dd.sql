
-- Create a table to store order information
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, processing, shipped, delivered, cancelled
    total_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    shipping_address JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a table to store the items within each order
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL, -- In a real system, this would be a FK to a products table
    merchant_id TEXT NOT NULL, -- To attribute sales to merchants
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL, -- Price at the time of purchase
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_order_items_merchant_id ON public.order_items(merchant_id);

-- Apply a trigger to automatically update the 'updated_at' timestamp on orders
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable Row Level Security for the new tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Define RLS policies for 'orders'
CREATE POLICY "Users can manage their own orders"
  ON public.orders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage all orders"
  ON public.orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Define RLS policies for 'order_items'
CREATE POLICY "Users can view items in their own orders"
  ON public.order_items FOR SELECT
  USING ((SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid());
  
CREATE POLICY "Admins can view and manage all order items"
  ON public.order_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

