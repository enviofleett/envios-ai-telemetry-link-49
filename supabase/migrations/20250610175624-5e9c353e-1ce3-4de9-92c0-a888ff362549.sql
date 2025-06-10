
-- Phase 1: Complete SMTP Database Cleanup
-- Remove all SMTP-related tables and dependencies

-- Drop triggers first (if any exist)
DROP TRIGGER IF EXISTS user_email_preferences_updated_at ON public.user_email_preferences;
DROP TRIGGER IF EXISTS enhanced_email_templates_updated_at ON public.enhanced_email_templates;
DROP TRIGGER IF EXISTS email_automation_rules_updated_at ON public.email_automation_rules;
DROP TRIGGER IF EXISTS email_notification_queue_updated_at ON public.email_notification_queue;

-- Drop functions related to email preferences
DROP FUNCTION IF EXISTS public.get_user_email_preferences();
DROP FUNCTION IF EXISTS public.get_user_email_preferences_by_id(uuid);
DROP FUNCTION IF EXISTS public.update_user_email_preferences_updated_at();
DROP FUNCTION IF EXISTS public.update_enhanced_email_templates_updated_at();
DROP FUNCTION IF EXISTS public.update_email_automation_rules_updated_at();

-- Drop all SMTP-related tables
DROP TABLE IF EXISTS public.admin_email_test_logs CASCADE;
DROP TABLE IF EXISTS public.email_automation_rules CASCADE;
DROP TABLE IF EXISTS public.email_notification_queue CASCADE;
DROP TABLE IF EXISTS public.user_email_preferences CASCADE;
DROP TABLE IF EXISTS public.enhanced_email_templates CASCADE;
DROP TABLE IF EXISTS public.email_notifications CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.smtp_configurations CASCADE;
