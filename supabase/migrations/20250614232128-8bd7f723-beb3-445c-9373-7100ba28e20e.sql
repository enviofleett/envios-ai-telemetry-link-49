
-- Create a new type for payout request statuses
CREATE TYPE public.payout_request_status AS ENUM ('pending', 'approved', 'processing', 'paid', 'rejected');

-- Create table to store agent payout requests
CREATE TABLE public.agent_payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.referral_agents(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status public.payout_request_status NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    transaction_ref TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a trigger to update the 'updated_at' column
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.agent_payout_requests
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.agent_payout_requests ENABLE ROW LEVEL SECURITY;

-- Policies for agent_payout_requests
-- Agents can see their own requests
CREATE POLICY "Agents can view their own payout requests"
ON public.agent_payout_requests
FOR SELECT
USING (agent_id = (SELECT id FROM public.referral_agents WHERE user_id = auth.uid()));

-- Agents can create their own requests
CREATE POLICY "Agents can create payout requests"
ON public.agent_payout_requests
FOR INSERT
WITH CHECK (agent_id = (SELECT id FROM public.referral_agents WHERE user_id = auth.uid()));

-- Admins can manage all requests
CREATE POLICY "Admins can manage all payout requests"
ON public.agent_payout_requests
FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create a junction table to link payout requests with specific commissions
CREATE TABLE public.payout_request_commissions (
    payout_request_id UUID NOT NULL REFERENCES public.agent_payout_requests(id) ON DELETE CASCADE,
    commission_id UUID NOT NULL REFERENCES public.referral_commissions(id) ON DELETE RESTRICT,
    PRIMARY KEY (payout_request_id, commission_id)
);

-- Enable RLS for junction table
ALTER TABLE public.payout_request_commissions ENABLE ROW LEVEL SECURITY;

-- Policies for payout_request_commissions
-- Users can see links if they can see the request
CREATE POLICY "Users can see commission links for their requests"
ON public.payout_request_commissions
FOR SELECT
USING (
    payout_request_id IN (
        SELECT id FROM public.agent_payout_requests WHERE agent_id = (SELECT id FROM public.referral_agents WHERE user_id = auth.uid())
    )
);

-- Admins can manage all links
CREATE POLICY "Admins can manage all commission links"
ON public.payout_request_commissions
FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));


-- Create an RPC function to create a payout request atomically
CREATE OR REPLACE FUNCTION public.create_payout_request(
  request_amount numeric,
  commission_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_profile record;
  new_payout_request_id uuid;
  commission_id uuid;
BEGIN
  -- Get agent profile from our system table
  SELECT id INTO agent_profile FROM public.referral_agents WHERE user_id = auth.uid();

  IF agent_profile.id IS NULL THEN
    RAISE EXCEPTION 'Agent profile not found for current user.';
  END IF;

  -- Create a new payout request
  INSERT INTO public.agent_payout_requests (agent_id, amount)
  VALUES (agent_profile.id, request_amount)
  RETURNING id INTO new_payout_request_id;

  -- Link commissions to the request and update their status to 'processing_payout'
  FOREACH commission_id IN ARRAY commission_ids
  LOOP
    INSERT INTO public.payout_request_commissions (payout_request_id, commission_id)
    VALUES (new_payout_request_id, commission_id);

    UPDATE public.referral_commissions
    SET status = 'processing_payout'
    WHERE id = commission_id;
  END LOOP;

  RETURN new_payout_request_id;
END;
$$;
