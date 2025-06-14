
-- 1. Create table for merchant categories if it doesn't exist
CREATE TABLE IF NOT EXISTS public.merchant_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    icon text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.merchant_categories IS 'Stores available categories for merchants.';

-- Pre-populate with some initial categories, doing nothing if they already exist
INSERT INTO public.merchant_categories (name, description, icon) VALUES
('Vehicle Parts', 'Sell new or used vehicle parts and accessories.', 'Wrench'),
('Fleet Services', 'Offer services like tracking, management software, or consulting.', 'Briefcase'),
('Insurance', 'Provide insurance products for vehicles and fleets.', 'Shield'),
('Maintenance & Repair', 'Workshop services for vehicle maintenance and repair.', 'Car'),
('Vehicle Sales', 'List new or used vehicles for sale.', 'Tags'),
('Financial Services', 'Offer loans, leasing, or other financial products for fleets.', 'Landmark')
ON CONFLICT (name) DO NOTHING;

-- 2. Modify the existing marketplace_settings table to add new fee-related columns
ALTER TABLE public.marketplace_settings ADD COLUMN IF NOT EXISTS free_categories_included smallint NOT NULL DEFAULT 2;
ALTER TABLE public.marketplace_settings ADD COLUMN IF NOT EXISTS additional_category_fee numeric(10, 2) NOT NULL DEFAULT 25.00;

-- 3. Ensure the trigger for updating the 'updated_at' timestamp is on the marketplace_settings table
DROP TRIGGER IF EXISTS set_timestamp ON public.marketplace_settings;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.marketplace_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create table to link merchants to their chosen categories if it doesn't exist
CREATE TABLE IF NOT EXISTS public.merchant_category_selections (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_application_id uuid NOT NULL REFERENCES public.merchant_applications(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.merchant_categories(id) ON DELETE RESTRICT,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (merchant_application_id, category_id)
);
COMMENT ON TABLE public.merchant_category_selections IS 'Links approved merchants to their selected business categories.';

-- 5. Update the merchant_applications table with new columns
ALTER TABLE public.merchant_applications ADD COLUMN IF NOT EXISTS selected_category_ids uuid[];
ALTER TABLE public.merchant_applications ADD COLUMN IF NOT EXISTS total_fee numeric(10, 2);
ALTER TABLE public.merchant_applications ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;

-- 6. Set up Row-Level Security (RLS) policies safely
-- For merchant_categories
ALTER TABLE public.merchant_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All users can view active categories" ON public.merchant_categories;
CREATE POLICY "All users can view active categories" ON public.merchant_categories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage categories" ON public.merchant_categories;
CREATE POLICY "Admins can manage categories" ON public.merchant_categories FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- For marketplace_settings
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All users can view marketplace settings" ON public.marketplace_settings;
CREATE POLICY "All users can view marketplace settings" ON public.marketplace_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update marketplace settings" ON public.marketplace_settings;
CREATE POLICY "Admins can update marketplace settings" ON public.marketplace_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- For merchant_category_selections
ALTER TABLE public.merchant_category_selections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own application category selections" ON public.merchant_category_selections;
CREATE POLICY "Users can view their own application category selections" ON public.merchant_category_selections FOR SELECT USING (EXISTS (SELECT 1 FROM merchant_applications WHERE id = merchant_application_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage all category selections" ON public.merchant_category_selections;
CREATE POLICY "Admins can manage all category selections" ON public.merchant_category_selections FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

