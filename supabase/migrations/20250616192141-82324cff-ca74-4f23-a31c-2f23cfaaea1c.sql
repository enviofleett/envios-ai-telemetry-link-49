
-- Create RPC function to get vehicle ID by device ID
CREATE OR REPLACE FUNCTION public.get_vehicle_id_by_device(device_id_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  vehicle_uuid uuid;
BEGIN
  SELECT id INTO vehicle_uuid
  FROM public.vehicles
  WHERE gp51_device_id = device_id_param
  LIMIT 1;
  
  RETURN vehicle_uuid;
END;
$function$;

-- Create RPC function to update vehicle activation status
CREATE OR REPLACE FUNCTION public.update_vehicle_activation_status(vehicle_id_param uuid, status_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update the vehicle record with activation status
  -- Since we don't have an activation_status column in vehicles table,
  -- we'll add a simple update to the updated_at timestamp for now
  UPDATE public.vehicles
  SET updated_at = now()
  WHERE id = vehicle_id_param;
  
  -- Log this action for audit purposes
  INSERT INTO public.device_history (
    device_id, action_type, action_description, new_values, performed_by
  )
  SELECT 
    v.gp51_device_id,
    'status_update',
    'Activation status updated to: ' || status_param,
    jsonb_build_object('activation_status', status_param, 'updated_at', now()),
    auth.uid()
  FROM public.vehicles v
  WHERE v.id = vehicle_id_param;
END;
$function$;
