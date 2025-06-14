
-- Phase 2: Auth & Security - Step 1: Database setup for Roles and Merchant Applications

-- Add 'merchant' to the existing app_role enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.app_role'::regtype AND enumlabel = 'merchant') THEN
        ALTER TYPE public.app_role ADD VALUE 'merchant';
    END IF;
END
$$;

-- Create a status type for merchant applications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'merchant_application_status') THEN
        CREATE TYPE public.merchant_application_status AS ENUM (
          'draft',
          'submitted',
          'in_review',
          'requires_more_info',
          'approved',
          'rejected'
        );
    END IF;
END
$$;

-- Create table for merchant applications
CREATE TABLE IF NOT EXISTS public.merchant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  business_address TEXT,
  website_url TEXT,
  business_type TEXT,
  business_registration_id TEXT,
  tax_id TEXT,
  status public.merchant_application_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add a trigger to update the 'updated_at' column
DROP TRIGGER IF EXISTS set_timestamp ON public.merchant_applications;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.merchant_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for merchant application documents
CREATE TABLE IF NOT EXISTS public.merchant_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.merchant_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ
);

-- Add RLS policies for merchant applications
ALTER TABLE public.merchant_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own merchant applications" ON public.merchant_applications;
CREATE POLICY "Users can manage their own merchant applications"
ON public.merchant_applications
FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all merchant applications" ON public.merchant_applications;
CREATE POLICY "Admins can manage all merchant applications"
ON public.merchant_applications
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for merchant application documents
ALTER TABLE public.merchant_application_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage documents for their own applications" ON public.merchant_application_documents;
CREATE POLICY "Users can manage documents for their own applications"
ON public.merchant_application_documents
FOR ALL
USING (
  (SELECT user_id FROM public.merchant_applications WHERE id = application_id) = auth.uid()
);

DROP POLICY IF EXISTS "Admins can manage all application documents" ON public.merchant_application_documents;
CREATE POLICY "Admins can manage all application documents"
ON public.merchant_application_documents
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
