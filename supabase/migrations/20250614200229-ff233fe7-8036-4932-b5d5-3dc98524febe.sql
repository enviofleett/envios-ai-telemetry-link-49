
-- Step 1: Drop the tables and their dependent constraints using CASCADE.
-- This is necessary to ensure a clean state due to inconsistencies.
DROP TABLE IF EXISTS public.marketplace_products CASCADE;
DROP TABLE IF EXISTS public.marketplace_merchants CASCADE;

-- Step 2: Recreate the merchants table with the correct schema and policies.
CREATE TABLE public.marketplace_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage merchants"
  ON public.marketplace_merchants
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read merchants"
  ON public.marketplace_merchants
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 3: Recreate the products table with the correct schema and policies.
CREATE TABLE public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  merchant_id UUID REFERENCES public.marketplace_merchants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage products"
  ON public.marketplace_products
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read products"
  ON public.marketplace_products
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 4: Recreate foreign key constraints that were dropped.
-- This ensures the integrity of your database is maintained.
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketplace_orders') AND
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'marketplace_orders' AND column_name = 'product_id') THEN
        ALTER TABLE public.marketplace_orders
        ADD CONSTRAINT marketplace_orders_product_id_fkey FOREIGN KEY (product_id)
        REFERENCES public.marketplace_products(id) ON DELETE SET NULL;
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_service_connections') AND
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_service_connections' AND column_name = 'product_id') THEN
        ALTER TABLE public.vehicle_service_connections
        ADD CONSTRAINT vehicle_service_connections_product_id_fkey FOREIGN KEY (product_id)
        REFERENCES public.marketplace_products(id) ON DELETE SET NULL;
    END IF;
END;
$$;

-- Step 5: Insert the demo data into the newly created tables.
DO $$
DECLARE
    merchant1_id UUID;
    merchant2_id UUID;
    merchant3_id UUID;
BEGIN
    -- Insert merchants
    INSERT INTO public.marketplace_merchants (name, contact_email) VALUES
    ('Super Electronics', 'contact@superelectronics.com'),
    ('Global Books', 'support@globalbooks.com'),
    ('Fashion Forward', 'hello@fashionforward.com');

    -- Get merchant IDs
    SELECT id INTO merchant1_id FROM public.marketplace_merchants WHERE name = 'Super Electronics';
    SELECT id INTO merchant2_id FROM public.marketplace_merchants WHERE name = 'Global Books';
    SELECT id INTO merchant3_id FROM public.marketplace_merchants WHERE name = 'Fashion Forward';

    -- Insert products
    INSERT INTO public.marketplace_products (name, category, description, merchant_id) VALUES
    ('Laptop Pro', 'Electronics', 'A powerful laptop for professionals.', merchant1_id),
    ('Wireless Mouse', 'Electronics', 'Ergonomic wireless mouse.', merchant1_id),
    ('4K Monitor', 'Electronics', 'Stunning 4K resolution monitor.', merchant1_id),
    ('The Art of Programming', 'Books', 'A classic book on software development.', merchant2_id),
    ('History of the World', 'Books', 'A comprehensive look at world history.', merchant2_id),
    ('Summer T-Shirt', 'Apparel', 'A light and comfortable t-shirt for summer.', merchant3_id),
    ('Leather Wallet', 'Accessories', 'A stylish and durable leather wallet.', merchant3_id);
END $$;

