
-- Function to grant merchant role
CREATE OR REPLACE FUNCTION public.grant_merchant_role_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- If the new status is 'approved' and the old status was not 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Grant the 'merchant' role to the user
    -- ON CONFLICT prevents errors if the user somehow already has the role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'merchant')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to call the function after an application is updated
DROP TRIGGER IF EXISTS on_merchant_application_approve ON public.merchant_applications;
CREATE TRIGGER on_merchant_application_approve
AFTER UPDATE ON public.merchant_applications
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.grant_merchant_role_on_approval();
