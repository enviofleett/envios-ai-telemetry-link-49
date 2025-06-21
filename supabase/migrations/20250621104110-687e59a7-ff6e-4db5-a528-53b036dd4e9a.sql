
-- Fix RLS policies for gp51_sessions table one by one to avoid deadlocks
-- First, recreate the INSERT policy
DROP POLICY IF EXISTS "Users can create their own GP51 sessions" ON public.gp51_sessions;

CREATE POLICY "Users can create their own GP51 sessions" 
ON public.gp51_sessions 
FOR INSERT 
TO authenticated
WITH CHECK (
  envio_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
