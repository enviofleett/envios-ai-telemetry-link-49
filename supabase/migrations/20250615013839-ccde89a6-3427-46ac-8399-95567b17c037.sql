
-- Create a table to store AI provider-specific thresholds
CREATE TABLE IF NOT EXISTS public.ai_provider_thresholds (
  provider TEXT PRIMARY KEY,
  daily_limit INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure provider is one of the supported types
ALTER TABLE public.ai_provider_thresholds
ADD CONSTRAINT provider_must_be_in_config CHECK (provider IN ('openai', 'google_gemini', 'anthropic_claude', 'hugging_face'));

-- Enable RLS for the table
ALTER TABLE public.ai_provider_thresholds ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage thresholds
CREATE POLICY "Admins can manage AI provider thresholds"
  ON public.ai_provider_thresholds FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create a trigger to automatically update the 'updated_at' column
CREATE TRIGGER handle_ai_provider_thresholds_updated_at
  BEFORE UPDATE ON public.ai_provider_thresholds
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();

-- Seed initial data for each provider to make management easier from the UI
INSERT INTO public.ai_provider_thresholds (provider, daily_limit, monthly_limit)
VALUES
  ('openai', 0, 0),
  ('google_gemini', 0, 0),
  ('anthropic_claude', 0, 0),
  ('hugging_face', 0, 0)
ON CONFLICT (provider) DO NOTHING;
