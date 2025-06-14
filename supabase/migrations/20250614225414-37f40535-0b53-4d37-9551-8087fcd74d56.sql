
-- Enable Row-Level Security on the referral_agents table
ALTER TABLE public.referral_agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Agents can view their own agent record" ON public.referral_agents;
DROP POLICY IF EXISTS "Admins can manage all agent records" ON public.referral_agents;

-- Policy: Agents can view their own record.
CREATE POLICY "Agents can view their own agent record"
ON public.referral_agents
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can manage all agent records.
CREATE POLICY "Admins can manage all agent records"
ON public.referral_agents
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable Row-Level Security on the referral_codes table
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Agents can view their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Agents can create their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can manage all referral codes" ON public.referral_codes;

-- Policy: Agents can view their own codes.
CREATE POLICY "Agents can view their own referral codes"
ON public.referral_codes
FOR SELECT
USING (agent_id IN (
    SELECT id FROM public.referral_agents WHERE user_id = auth.uid()
));

-- Policy: Agents can create codes for themselves.
CREATE POLICY "Agents can create their own referral codes"
ON public.referral_codes
FOR INSERT
WITH CHECK (agent_id IN (
    SELECT id FROM public.referral_agents WHERE user_id = auth.uid()
));

-- Policy: Admins can manage all codes.
CREATE POLICY "Admins can manage all referral codes"
ON public.referral_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

