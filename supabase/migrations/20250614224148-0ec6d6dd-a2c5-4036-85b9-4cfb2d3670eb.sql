
-- Add 'agent' to the app_role enum if it doesn't exist.
DO $$
BEGIN
    -- Check if app_role type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        -- If it doesn't exist, create it with all necessary roles. This is a fallback.
        CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'merchant', 'agent');
    ELSE
        -- If it exists, try to add the 'agent' value.
        -- First check if 'agent' already exists to avoid errors on reruns.
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'app_role'::regtype AND enumlabel = 'agent') THEN
            ALTER TYPE public.app_role ADD VALUE 'agent';
        END IF;
    END IF;
END$$;

-- Function to grant/revoke agent role based on status
CREATE OR REPLACE FUNCTION public.handle_agent_role_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- If agent is approved ('active'), grant the 'agent' role.
    IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'agent')
        ON CONFLICT (user_id, role) DO NOTHING;
    -- If agent is no longer active (e.g., suspended, rejected), revoke the 'agent' role.
    ELSIF NEW.status IN ('suspended', 'rejected') AND OLD.status = 'active' THEN
        DELETE FROM public.user_roles
        WHERE user_id = NEW.user_id AND role = 'agent';
    END IF;
    RETURN NEW;
END;
$$;

-- Create a trigger on referral_agents table to automate role changes
DROP TRIGGER IF EXISTS on_agent_status_change ON public.referral_agents;
CREATE TRIGGER on_agent_status_change
AFTER UPDATE OF status ON public.referral_agents
FOR EACH ROW
EXECUTE FUNCTION public.handle_agent_role_on_status_change();
