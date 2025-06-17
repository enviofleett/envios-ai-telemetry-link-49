
-- Phase 1: Critical Security Fixes for GP51 Integration
-- Enable Supabase Vault extension and create secure credential storage

-- Enable the vault extension if not already enabled
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Create secure credential storage table
CREATE TABLE IF NOT EXISTS public.gp51_secure_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  credential_vault_id UUID NOT NULL, -- References vault.secrets(id)
  api_url TEXT DEFAULT 'https://www.gps51.com/webapi',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_validated_at TIMESTAMP WITH TIME ZONE,
  validation_status TEXT DEFAULT 'pending',
  UNIQUE(user_id, username)
);

-- Enable RLS on the new table
ALTER TABLE public.gp51_secure_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for secure credential access
CREATE POLICY "Users can manage their own GP51 credentials" 
ON public.gp51_secure_credentials 
FOR ALL 
USING (user_id = auth.uid());

-- Create security audit table for GP51 operations
CREATE TABLE IF NOT EXISTS public.gp51_security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  operation_type TEXT NOT NULL,
  operation_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.gp51_security_audit ENABLE ROW LEVEL SECURITY;

-- Admin-only access to audit logs
CREATE POLICY "Admins can view all GP51 audit logs" 
ON public.gp51_security_audit 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create function to securely store GP51 credentials
CREATE OR REPLACE FUNCTION public.store_gp51_credentials(
  p_username TEXT,
  p_password TEXT,
  p_api_url TEXT DEFAULT 'https://www.gps51.com/webapi'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vault_secret_id UUID;
  credential_id UUID;
BEGIN
  -- Store password in vault with proper encryption
  INSERT INTO vault.secrets (name, secret)
  VALUES (
    'gp51_password_' || auth.uid()::text || '_' || extract(epoch from now())::text,
    p_password
  )
  RETURNING id INTO vault_secret_id;
  
  -- Store credential reference
  INSERT INTO public.gp51_secure_credentials (
    user_id, username, credential_vault_id, api_url
  )
  VALUES (auth.uid(), p_username, vault_secret_id, p_api_url)
  ON CONFLICT (user_id, username) 
  DO UPDATE SET 
    credential_vault_id = EXCLUDED.credential_vault_id,
    api_url = EXCLUDED.api_url,
    updated_at = now()
  RETURNING id INTO credential_id;
  
  -- Log the operation
  INSERT INTO public.gp51_security_audit (
    user_id, operation_type, operation_details, success
  ) VALUES (
    auth.uid(), 'CREDENTIAL_STORED', 
    jsonb_build_object('username', p_username, 'api_url', p_api_url),
    true
  );
  
  RETURN credential_id;
END;
$$;

-- Create function to retrieve GP51 credentials securely
CREATE OR REPLACE FUNCTION public.get_gp51_credentials(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  username TEXT,
  password TEXT,
  api_url TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user can access their own credentials or is admin
  IF p_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    gc.username,
    vs.decrypted_secret::TEXT as password,
    gc.api_url,
    gc.is_active
  FROM public.gp51_secure_credentials gc
  JOIN vault.decrypted_secrets vs ON gc.credential_vault_id = vs.id
  WHERE gc.user_id = p_user_id AND gc.is_active = true
  ORDER BY gc.updated_at DESC
  LIMIT 1;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gp51_secure_credentials_user_active 
ON public.gp51_secure_credentials(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_gp51_security_audit_user_created 
ON public.gp51_security_audit(user_id, created_at DESC);

-- Add trigger to update timestamps
CREATE TRIGGER update_gp51_secure_credentials_updated_at
BEFORE UPDATE ON public.gp51_secure_credentials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CRITICAL: Remove the insecure password_hash column from gp51_sessions
-- This will be done after credential migration is complete
-- ALTER TABLE public.gp51_sessions DROP COLUMN IF EXISTS password_hash;
