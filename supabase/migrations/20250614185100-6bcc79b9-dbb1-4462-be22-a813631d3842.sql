
-- Create a new ENUM type for application status
CREATE TYPE merchant_application_status AS ENUM (
  'draft',
  'submitted',
  'in_review',
  'requires_more_info',
  'approved',
  'rejected'
);

-- Create the table for merchant applications
CREATE TABLE public.merchant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  business_address TEXT,
  website_url TEXT,
  business_type TEXT,
  business_registration_id TEXT,
  tax_id TEXT,
  status merchant_application_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add an index on user_id for faster lookups
CREATE INDEX idx_merchant_applications_user_id ON public.merchant_applications(user_id);

-- Add an index on status for filtering
CREATE INDEX idx_merchant_applications_status ON public.merchant_applications(status);

-- Use the existing trigger function to update the 'updated_at' timestamp on changes
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.merchant_applications
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- Create the table for application documents
CREATE TABLE public.merchant_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.merchant_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- e.g., 'business_license', 'tax_document'
  file_path TEXT NOT NULL, -- Path in Supabase storage
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ
);

-- Add an index for faster document retrieval per application
CREATE INDEX idx_merchant_application_documents_application_id ON public.merchant_application_documents(application_id);

-- Enable Row Level Security (RLS) on the new tables
ALTER TABLE public.merchant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_application_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for merchant_applications
CREATE POLICY "Applicants can manage their own applications"
  ON public.merchant_applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage all applications"
  ON public.merchant_applications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for merchant_application_documents
CREATE POLICY "Applicants can manage their own documents"
  ON public.merchant_application_documents FOR ALL
  USING ((
    SELECT user_id FROM public.merchant_applications WHERE id = application_id
  ) = auth.uid());

CREATE POLICY "Admins can view and manage all documents"
  ON public.merchant_application_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create a storage bucket for merchant documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('merchant-documents', 'merchant-documents', false, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the new storage bucket
CREATE POLICY "Applicants can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'merchant-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Applicants can view their own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'merchant-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Applicants can update their own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'merchant-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
  
CREATE POLICY "Admins can access all documents"
  ON storage.objects FOR ALL
  USING (bucket_id = 'merchant-documents' AND public.has_role(auth.uid(), 'admin'));

