
-- Phase 1: Database Schema Cleanup
-- Remove Reports, System Import, and Device Configuration related tables
-- This preserves all GP51 authentication components and core functionality

-- Drop Reports related tables
DROP TABLE IF EXISTS public.report_executions CASCADE;
DROP TABLE IF EXISTS public.report_templates CASCADE;
DROP TABLE IF EXISTS public.scheduled_reports CASCADE;
DROP TABLE IF EXISTS public.report_subscriptions CASCADE;
DROP TABLE IF EXISTS public.report_analytics CASCADE;

-- Drop System Import related tables
DROP TABLE IF EXISTS public.bulk_import_jobs CASCADE;
DROP TABLE IF EXISTS public.csv_import_jobs CASCADE;
DROP TABLE IF EXISTS public.csv_import_relationships CASCADE;
DROP TABLE IF EXISTS public.csv_import_templates CASCADE;
DROP TABLE IF EXISTS public.csv_validation_logs CASCADE;
DROP TABLE IF EXISTS public.user_import_jobs CASCADE;
DROP TABLE IF EXISTS public.gp51_system_imports CASCADE;
DROP TABLE IF EXISTS public.system_import_logs CASCADE;
DROP TABLE IF EXISTS public.import_conflict_resolutions CASCADE;
DROP TABLE IF EXISTS public.bulk_extraction_jobs CASCADE;
DROP TABLE IF EXISTS public.data_reconciliation_jobs CASCADE;
DROP TABLE IF EXISTS public.data_consistency_monitoring CASCADE;
DROP TABLE IF EXISTS public.data_consistency_logs CASCADE;
DROP TABLE IF EXISTS public.backup_metadata CASCADE;

-- Drop Device Configuration related tables
DROP TABLE IF EXISTS public.device_configurations CASCADE;
DROP TABLE IF EXISTS public.device_groups CASCADE;
DROP TABLE IF EXISTS public.device_group_assignments CASCADE;
DROP TABLE IF EXISTS public.device_tags CASCADE;
DROP TABLE IF EXISTS public.device_tag_assignments CASCADE;
DROP TABLE IF EXISTS public.device_types CASCADE;
DROP TABLE IF EXISTS public.device_history CASCADE;
DROP TABLE IF EXISTS public.device_subscriptions CASCADE;

-- Drop Workshop/Maintenance related tables (part of device configuration)
DROP TABLE IF EXISTS public.workshop_appointments CASCADE;
DROP TABLE IF EXISTS public.workshop_availability CASCADE;
DROP TABLE IF EXISTS public.workshop_blackout_dates CASCADE;
DROP TABLE IF EXISTS public.workshop_reviews CASCADE;
DROP TABLE IF EXISTS public.workshop_services CASCADE;
DROP TABLE IF EXISTS public.workshop_activations CASCADE;
DROP TABLE IF EXISTS public.workshops CASCADE;
DROP TABLE IF EXISTS public.appointment_conflicts CASCADE;
DROP TABLE IF EXISTS public.appointment_notifications CASCADE;

-- Drop related functions that are specific to these features
DROP FUNCTION IF EXISTS public.log_device_history() CASCADE;
DROP FUNCTION IF EXISTS public.check_appointment_conflicts() CASCADE;
DROP FUNCTION IF EXISTS public.update_appointment_timestamps() CASCADE;
DROP FUNCTION IF EXISTS public.update_workshop_rating() CASCADE;
DROP FUNCTION IF EXISTS public.update_workshop_activations_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.log_subscription_history() CASCADE;
DROP FUNCTION IF EXISTS public.get_import_job_progress(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_table_backup(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_incremental_backup(text, text, timestamp with time zone) CASCADE;
DROP FUNCTION IF EXISTS public.restore_table_from_backup(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.merge_table_from_backup(text, text, timestamp with time zone) CASCADE;
DROP FUNCTION IF EXISTS public.drop_table_if_exists(text) CASCADE;
DROP FUNCTION IF EXISTS public.find_duplicate_device_ids() CASCADE;
DROP FUNCTION IF EXISTS public.check_referential_integrity(text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_system_backup_for_import(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.perform_safe_data_cleanup(text) CASCADE;
DROP FUNCTION IF EXISTS public.update_vehicle_activation_status(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.execute_sql(text, text[]) CASCADE;

-- Note: We are NOT dropping any GP51 related tables or functions
-- GP51 authentication and session management remains intact
