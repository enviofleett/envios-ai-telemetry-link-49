
-- Create a table for marketplace merchants if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for merchants table
ALTER TABLE public.marketplace_merchants ENABLE ROW LEVEL SECURITY;

-- Allow admin users to manage merchants
DROP POLICY IF EXISTS "Admins can manage merchants" ON public.marketplace_merchants;
CREATE POLICY "Admins can manage merchants"
  ON public.marketplace_merchants
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to read merchants
DROP POLICY IF EXISTS "Authenticated users can read merchants" ON public.marketplace_merchants;
CREATE POLICY "Authenticated users can read merchants"
  ON public.marketplace_merchants
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create a table for marketplace products if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  merchant_id UUID REFERENCES public.marketplace_merchants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for products table
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

-- Allow admin users to manage products
DROP POLICY IF EXISTS "Admins can manage products" ON public.marketplace_products;
CREATE POLICY "Admins can manage products"
  ON public.marketplace_products
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to read products
DROP POLICY IF EXISTS "Authenticated users can read products" ON public.marketplace_products;
CREATE POLICY "Authenticated users can read products"
  ON public.marketplace_products
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Update the analytics function to use the new tables
CREATE OR REPLACE FUNCTION public.get_market_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics_data jsonb;
  total_sales numeric;
  total_orders bigint;
  avg_order_value numeric;
  sales_by_category jsonb;
  sales_by_merchant jsonb;
BEGIN
  -- Aggregate basic stats from the orders table.
  SELECT
    COALESCE(SUM(total_amount), 0),
    COALESCE(COUNT(id), 0),
    COALESCE(AVG(total_amount), 0)
  INTO
    total_sales,
    total_orders,
    avg_order_value
  FROM public.orders
  WHERE status <> 'cancelled';

  -- Aggregate sales by product category
  SELECT jsonb_agg(cats)
  INTO sales_by_category
  FROM (
    SELECT
      mp.category,
      SUM(oi.price * oi.quantity) AS total_value
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    JOIN public.marketplace_products mp ON oi.product_id::uuid = mp.id
    WHERE o.status <> 'cancelled' AND oi.product_id IS NOT NULL
    GROUP BY mp.category
    ORDER BY total_value DESC
  ) AS cats;

  -- Aggregate sales by merchant name
  SELECT jsonb_agg(merchs)
  INTO sales_by_merchant
  FROM (
    SELECT
      mm.name as merchant_name,
      SUM(oi.price * oi.quantity) AS total_value
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    JOIN public.marketplace_merchants mm ON oi.merchant_id::uuid = mm.id
    WHERE o.status <> 'cancelled' AND oi.merchant_id IS NOT NULL
    GROUP BY mm.name
    ORDER BY total_value DESC
  ) AS merchs;

  -- Combine all data into a single JSONB object to be returned.
  analytics_data := jsonb_build_object(
    'total_sales', total_sales,
    'total_orders', total_orders,
    'average_order_value', avg_order_value,
    'sales_by_category', COALESCE(sales_by_category, '[]'::jsonb),
    'sales_by_merchant', COALESCE(sales_by_merchant, '[]'::jsonb)
  );

  RETURN analytics_data;
END;
$$;
