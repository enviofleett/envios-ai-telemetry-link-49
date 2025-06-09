
-- Drop all map-related tables and their dependencies
DROP TABLE IF EXISTS map_usage_analytics CASCADE;
DROP TABLE IF EXISTS map_performance_metrics CASCADE;
DROP TABLE IF EXISTS map_provider_health_logs CASCADE;
DROP TABLE IF EXISTS map_failover_events CASCADE;
DROP TABLE IF EXISTS map_api_usage CASCADE;
DROP TABLE IF EXISTS map_api_configs CASCADE;

-- Drop map-related functions
DROP FUNCTION IF EXISTS public.get_best_map_provider() CASCADE;
DROP FUNCTION IF EXISTS public.log_map_provider_health(uuid, text, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.log_map_failover(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_active_map_api() CASCADE;
DROP FUNCTION IF EXISTS public.increment_map_api_usage(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_map_config_usage_percentage(uuid, date) CASCADE;
