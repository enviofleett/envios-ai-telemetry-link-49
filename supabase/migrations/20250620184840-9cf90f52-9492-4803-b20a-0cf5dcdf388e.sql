
-- Create table for mapping Envio users to GP51 usernames
CREATE TABLE public.gp51_user_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  envio_user_id UUID REFERENCES public.envio_users(id) ON DELETE CASCADE NOT NULL,
  gp51_username TEXT NOT NULL,
  gp51_user_type INTEGER DEFAULT 3,
  mapping_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'auto', 'migrated'
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(envio_user_id, gp51_username)
);

-- Enable RLS
ALTER TABLE public.gp51_user_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for GP51 user mappings
CREATE POLICY "Users can view their own GP51 mappings" 
  ON public.gp51_user_mappings 
  FOR SELECT 
  USING (
    envio_user_id IN (
      SELECT id FROM public.envio_users WHERE email = auth.email()
    )
  );

CREATE POLICY "Users can create their own GP51 mappings" 
  ON public.gp51_user_mappings 
  FOR INSERT 
  WITH CHECK (
    envio_user_id IN (
      SELECT id FROM public.envio_users WHERE email = auth.email()
    )
  );

CREATE POLICY "Users can update their own GP51 mappings" 
  ON public.gp51_user_mappings 
  FOR UPDATE 
  USING (
    envio_user_id IN (
      SELECT id FROM public.envio_users WHERE email = auth.email()
    )
  );

CREATE POLICY "Admins can manage all GP51 mappings" 
  ON public.gp51_user_mappings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_gp51_user_mappings_envio_user_id ON public.gp51_user_mappings(envio_user_id);
CREATE INDEX idx_gp51_user_mappings_gp51_username ON public.gp51_user_mappings(gp51_username);

-- Create trigger for updated_at
CREATE TRIGGER update_gp51_user_mappings_updated_at
  BEFORE UPDATE ON public.gp51_user_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
