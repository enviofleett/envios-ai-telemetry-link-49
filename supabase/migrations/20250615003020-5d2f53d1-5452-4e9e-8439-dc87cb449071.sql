
-- Create a new table for AI assistant settings
CREATE TABLE public.ai_assistant_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  provider text NOT NULL DEFAULT 'openai',
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  system_prompt text,
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Enable RLS for the new table
ALTER TABLE public.ai_assistant_settings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow admins to manage the settings
CREATE POLICY "Allow admin access to AI settings"
  ON public.ai_assistant_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  
-- Create a trigger to automatically update the 'updated_at' timestamp
CREATE TRIGGER handle_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_assistant_settings
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();

-- Insert a default row into the settings table
INSERT INTO public.ai_assistant_settings (system_prompt) VALUES ('You are a helpful AI assistant for a fleet management platform. Provide concise and accurate information about vehicles, maintenance, and fleet operations.');
