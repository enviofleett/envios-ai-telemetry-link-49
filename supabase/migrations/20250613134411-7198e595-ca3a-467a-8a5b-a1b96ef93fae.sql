
-- Phase 1: Database Schema Refinement (Fixed)

-- First, let's check what roles exist in the app_role enum and add missing ones
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dispatcher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'fleet_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pending';

-- Create user_profiles table as the single source of truth for application-specific user data
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT,
  registration_status TEXT NOT NULL DEFAULT 'pending_email_verification',
  role app_role NOT NULL DEFAULT 'user',
  company_id UUID,
  first_name TEXT,
  last_name TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add check constraints for valid registration statuses
ALTER TABLE public.user_profiles ADD CONSTRAINT valid_registration_status 
CHECK (registration_status IN ('pending_email_verification', 'pending_phone_verification', 'pending_admin_approval', 'active', 'rejected'));

-- Add updated_at trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- System can insert profiles during registration
CREATE POLICY "System can insert profiles" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Update vehicles table to properly link to user_profiles
-- First, add the new column if it doesn't exist
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Create index for better performance on user_profile_id lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_user_profile_id ON public.vehicles(user_profile_id);

-- Create a function to automatically create user profiles when auth users are created
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert into user_profiles with default values
  INSERT INTO public.user_profiles (
    id,
    phone_number,
    registration_status,
    role,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'phone_number',
    'pending_email_verification',
    'user',
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Migration: Copy existing data from envio_users to user_profiles
-- This will preserve existing user data during the transition
INSERT INTO public.user_profiles (
  id,
  phone_number,
  registration_status,
  role,
  first_name,
  last_name,
  created_at,
  updated_at
)
SELECT 
  eu.id,
  eu.phone_number,
  CASE 
    WHEN eu.registration_status = 'completed' THEN 'active'
    WHEN eu.registration_status = 'pending' THEN 'pending_admin_approval'
    ELSE COALESCE(eu.registration_status, 'pending_email_verification')
  END as registration_status,
  COALESCE(ur.role, 'user') as role,
  SPLIT_PART(eu.name, ' ', 1) as first_name,
  CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(eu.name, ' '), 1) > 1 
    THEN SUBSTRING(eu.name FROM POSITION(' ' IN eu.name) + 1)
    ELSE NULL 
  END as last_name,
  eu.created_at,
  eu.updated_at
FROM public.envio_users eu
LEFT JOIN public.user_roles ur ON eu.id = ur.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.id = eu.id
);

-- Update vehicles to link to user_profiles instead of envio_users
UPDATE public.vehicles 
SET user_profile_id = envio_user_id 
WHERE envio_user_id IS NOT NULL 
AND user_profile_id IS NULL;

-- Add vehicle assignment audit table for tracking changes
CREATE TABLE IF NOT EXISTS public.vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT NOT NULL,
  user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  assignment_reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on vehicle_assignments
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policy for vehicle assignments - admins can manage all
CREATE POLICY "Admins can manage vehicle assignments" 
ON public.vehicle_assignments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_vehicle_id ON public.vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_user_profile_id ON public.vehicle_assignments(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_active ON public.vehicle_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_registration_status ON public.user_profiles(registration_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
