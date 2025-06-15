
-- Add chatbot prompt limit to subscriber packages
ALTER TABLE public.subscriber_packages
ADD COLUMN IF NOT EXISTS chatbot_prompt_limit INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.subscriber_packages.chatbot_prompt_limit IS 'Number of free chatbot prompts included per month.';

-- Insert the AI Chatbot feature into package_features if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.package_features WHERE feature_id = 'ai_chatbot') THEN
    INSERT INTO public.package_features (feature_id, feature_name, description, category, is_active)
    VALUES ('ai_chatbot', 'AI Chatbot Assistant', 'Enables access to the AI-powered chatbot for assistance.', 'AI', true);
  END IF;
END;
$$;


-- Table for storing conversations
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.chatbot_conversations IS 'Stores information about a single chatbot conversation.';

DROP TRIGGER IF EXISTS handle_chatbot_conversations_updated_at ON public.chatbot_conversations;
CREATE TRIGGER handle_chatbot_conversations_updated_at
  BEFORE UPDATE ON public.chatbot_conversations
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();

-- Table for storing individual messages
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.chatbot_messages IS 'Stores individual messages within a chatbot conversation.';

-- Table for tracking monthly usage
CREATE TABLE IF NOT EXISTS public.chatbot_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_period_start DATE NOT NULL,
  prompt_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_period_start)
);
COMMENT ON TABLE public.chatbot_usage_tracking IS 'Tracks monthly chatbot prompt usage for each user.';

DROP TRIGGER IF EXISTS handle_chatbot_usage_tracking_updated_at ON public.chatbot_usage_tracking;
CREATE TRIGGER handle_chatbot_usage_tracking_updated_at
  BEFORE UPDATE ON public.chatbot_usage_tracking
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();

-- Table for defining purchasable prompt bundles
CREATE TABLE IF NOT EXISTS public.chatbot_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  prompt_count INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.chatbot_bundles IS 'Defines purchasable chatbot prompt bundles.';

-- Table for tracking user bundle purchases
CREATE TABLE IF NOT EXISTS public.chatbot_bundle_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.chatbot_bundles(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  prompts_granted INTEGER NOT NULL,
  prompts_used INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  payment_id TEXT
);
COMMENT ON TABLE public.chatbot_bundle_purchases IS 'Tracks user purchases of chatbot prompt bundles.';

-- RLS Policies
-- Conversations
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.chatbot_conversations;
CREATE POLICY "Users can manage their own conversations"
  ON public.chatbot_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Messages
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON public.chatbot_messages;
CREATE POLICY "Users can manage messages in their conversations"
  ON public.chatbot_messages FOR ALL
  USING (
    auth.uid() = (
      SELECT user_id FROM public.chatbot_conversations WHERE id = conversation_id
    )
  );

-- Usage Tracking
ALTER TABLE public.chatbot_usage_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.chatbot_usage_tracking;
CREATE POLICY "Users can view their own usage"
  ON public.chatbot_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all usage" ON public.chatbot_usage_tracking;
CREATE POLICY "Admins can view all usage"
  ON public.chatbot_usage_tracking FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bundle Purchases
ALTER TABLE public.chatbot_bundle_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own bundle purchases" ON public.chatbot_bundle_purchases;
CREATE POLICY "Users can view their own bundle purchases"
  ON public.chatbot_bundle_purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all bundle purchases" ON public.chatbot_bundle_purchases;
CREATE POLICY "Admins can view all bundle purchases"
  ON public.chatbot_bundle_purchases FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bundles should be public to authenticated users
ALTER TABLE public.chatbot_bundles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view available bundles" ON public.chatbot_bundles;
CREATE POLICY "Authenticated users can view available bundles"
  ON public.chatbot_bundles FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage bundles
DROP POLICY IF EXISTS "Admins can manage bundles" ON public.chatbot_bundles;
CREATE POLICY "Admins can manage bundles"
  ON public.chatbot_bundles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
