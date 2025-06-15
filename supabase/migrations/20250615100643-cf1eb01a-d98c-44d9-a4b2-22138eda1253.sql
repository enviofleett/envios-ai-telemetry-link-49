
-- Phase 1: Database Schema Consolidation and Enhancement for SMTP

-- Step 1: Drop legacy SMTP configurations table to ensure a clean state.
DROP TABLE IF EXISTS public.smtp_configurations CASCADE;

-- Step 2: Enhance the main 'smtp_settings' table for security and testing.
-- Rename the password column to clarify that it stores encrypted data.
-- This change requires re-entering passwords via the UI to encrypt them.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='smtp_settings' AND column_name='smtp_password') THEN
    ALTER TABLE public.smtp_settings RENAME COLUMN smtp_password TO smtp_password_encrypted;
  END IF;
END $$;

-- Add new columns to track the status of SMTP connection tests.
ALTER TABLE public.smtp_settings
ADD COLUMN IF NOT EXISTS last_test_status TEXT, -- e.g., 'success', 'failure'
ADD COLUMN IF NOT EXISTS last_test_message TEXT, -- A message detailing the test outcome
ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMP WITH TIME ZONE; -- When the last test was run
