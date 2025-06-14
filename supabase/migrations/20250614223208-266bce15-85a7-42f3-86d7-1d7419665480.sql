
-- Phase 1 (Corrected): Create the full database schema for the referral system.

-- Step 1: Drop all existing referral tables and types to ensure a clean slate.
DROP TABLE IF EXISTS public.referral_agent_subscriptions CASCADE;
DROP TABLE IF EXISTS public.referral_commissions CASCADE;
DROP TABLE IF EXISTS public.referred_users CASCADE;
DROP TABLE IF EXISTS public.referral_codes CASCADE;
DROP TABLE IF EXISTS public.referral_settings CASCADE;
DROP TABLE IF EXISTS public.referral_agents CASCADE;

DROP TYPE IF EXISTS referral_agent_status CASCADE;
DROP TYPE IF EXISTS commission_source_type CASCADE;
DROP TYPE IF EXISTS commission_status CASCADE;

-- Step 2: Create custom ENUM types for statuses and sources.
CREATE TYPE referral_agent_status AS ENUM ('pending_approval', 'active', 'suspended', 'rejected');
CREATE TYPE commission_source_type AS ENUM ('subscription_upgrade', 'marketplace_fee');
CREATE TYPE commission_status AS ENUM ('pending_payout', 'paid', 'cancelled');

-- Step 3: Create the new referral_agents table.
CREATE TABLE public.referral_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status referral_agent_status NOT NULL DEFAULT 'pending_approval',
  bank_account_details jsonb,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  subscription_expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.referral_agents IS 'Stores information about referral agents.';
CREATE TRIGGER set_referral_agents_updated_at
BEFORE UPDATE ON public.referral_agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 4: Create the referral_settings table.
CREATE TABLE public.referral_settings (
    id smallint PRIMARY KEY CHECK (id = 1),
    agent_commission_rate_subscription numeric(5, 2) NOT NULL DEFAULT 20.00,
    agent_commission_rate_marketplace numeric(5, 2) NOT NULL DEFAULT 5.00,
    commission_duration_days integer NOT NULL DEFAULT 365,
    trial_package_id text,
    trial_duration_days integer NOT NULL DEFAULT 30,
    allow_subscription_commissions boolean NOT NULL DEFAULT true,
    allow_marketplace_commissions boolean NOT NULL DEFAULT true,
    agent_annual_fee numeric(10, 2) NOT NULL DEFAULT 99.00,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.referral_settings IS 'Singleton table for global referral program settings.';
CREATE TRIGGER set_referral_settings_updated_at
BEFORE UPDATE ON public.referral_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row.
INSERT INTO public.referral_settings (id) VALUES (1);

-- Step 5: Create the remaining referral tables.
CREATE TABLE public.referral_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES public.referral_agents(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    usage_count integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.referral_codes IS 'Stores referral codes for agents.';
CREATE INDEX idx_referral_codes_agent_id ON public.referral_codes(agent_id);

CREATE TABLE public.referred_users (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    referring_agent_id uuid NOT NULL REFERENCES public.referral_agents(id) ON DELETE RESTRICT,
    referral_code_id uuid REFERENCES public.referral_codes(id) ON DELETE SET NULL,
    signed_up_at timestamp with time zone NOT NULL DEFAULT now(),
    commission_earnings_end_date timestamp with time zone NOT NULL
);
COMMENT ON TABLE public.referred_users IS 'Links referred users to their referring agent.';
CREATE INDEX idx_referred_users_referring_agent_id ON public.referred_users(referring_agent_id);

CREATE TABLE public.referral_commissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES public.referral_agents(id) ON DELETE RESTRICT,
    referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_type commission_source_type NOT NULL,
    source_id text NOT NULL,
    source_amount numeric(10, 2) NOT NULL,
    commission_rate numeric(5, 2) NOT NULL,
    commission_amount numeric(10, 2) GENERATED ALWAYS AS (source_amount * (commission_rate / 100)) STORED,
    status commission_status NOT NULL DEFAULT 'pending_payout',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    paid_at timestamp with time zone
);
COMMENT ON TABLE public.referral_commissions IS 'Tracks commissions earned by agents.';
CREATE INDEX idx_referral_commissions_agent_id ON public.referral_commissions(agent_id);
CREATE INDEX idx_referral_commissions_status ON public.referral_commissions(status);

CREATE TABLE public.referral_agent_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES public.referral_agents(id) ON DELETE CASCADE,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    amount_paid numeric(10, 2) NOT NULL,
    payment_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.referral_agent_subscriptions IS 'Tracks annual fee payments for referral agents.';
CREATE INDEX idx_referral_agent_subscriptions_agent_id ON public.referral_agent_subscriptions(agent_id);

-- Step 6: Apply Row-Level Security (RLS) policies to all tables.

-- RLS for referral_agents
ALTER TABLE public.referral_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can view and update their own profile" ON public.referral_agents FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all agent profiles" ON public.referral_agents FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for referral_settings
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read referral settings" ON public.referral_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage referral settings" ON public.referral_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for referral_codes
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can manage their own referral codes" ON public.referral_codes FOR ALL USING (EXISTS (SELECT 1 FROM public.referral_agents ra WHERE ra.id = agent_id AND ra.user_id = auth.uid()));
CREATE POLICY "Admins can manage all referral codes" ON public.referral_codes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for referred_users
ALTER TABLE public.referred_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can view users they referred" ON public.referred_users FOR SELECT USING (EXISTS (SELECT 1 FROM public.referral_agents ra WHERE ra.id = referring_agent_id AND ra.user_id = auth.uid()));
CREATE POLICY "Admins can view all referred users" ON public.referred_users FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS for referral_commissions
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can view their own commissions" ON public.referral_commissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.referral_agents ra WHERE ra.id = agent_id AND ra.user_id = auth.uid()));
CREATE POLICY "Admins can manage all commissions" ON public.referral_commissions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for referral_agent_subscriptions
ALTER TABLE public.referral_agent_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can view their own subscriptions" ON public.referral_agent_subscriptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.referral_agents ra WHERE ra.id = agent_id AND ra.user_id = auth.uid()));
CREATE POLICY "Admins can manage agent subscriptions" ON public.referral_agent_subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
