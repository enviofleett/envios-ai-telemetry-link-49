
-- This migration adds more detailed fields to the products table
-- and creates a new table for managing product reviews.

-- Step 1: Add new columns to the marketplace_products table
ALTER TABLE public.marketplace_products
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_unit TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS screenshots TEXT[],
ADD COLUMN IF NOT EXISTS compatibility TEXT[],
ADD COLUMN IF NOT EXISTS "size" TEXT,
ADD COLUMN IF NOT EXISTS "version" TEXT,
ADD COLUMN IF NOT EXISTS developer TEXT,
ADD COLUMN IF NOT EXISTS connection_fee NUMERIC DEFAULT 0;

-- Step 2: Create a new table for product reviews
CREATE TABLE IF NOT EXISTS public.marketplace_product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Enable Row Level Security for the new reviews table
ALTER TABLE public.marketplace_product_reviews ENABLE ROW LEVEL SECURITY;

-- Step 4: Define policies for the reviews table
CREATE POLICY "Anyone can read product reviews"
  ON public.marketplace_product_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can write reviews"
  ON public.marketplace_product_reviews
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reviews"
  ON public.marketplace_product_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.marketplace_product_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

