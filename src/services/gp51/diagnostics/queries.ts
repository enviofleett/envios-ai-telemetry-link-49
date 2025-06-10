
import { supabase } from '@/integrations/supabase/client';
import type { GP51Session, VehicleSample, VehicleUpdate, Gp51Token } from './types';

// Get active GP51 sessions - direct table query
export async function getActiveGP51Sessions(): Promise<{ data: GP51Session[]; error: any }> {
  const { data, error } = await supabase
    .from('gp51_sessions')
    .select('*')
    .eq('is_active', true)
    .not('gp51_token', 'is', null);

  return {
    data: data ?? [],
    error
  };
}

// Get vehicle data sample - direct table query with limit
export async function getVehicleDataSample(): Promise<{ data: VehicleSample[]; error: any }> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .limit(10);

  return {
    data: data ?? [],
    error
  };
}

// Get recent vehicle updates - direct table query ordered by updated_at
export async function getRecentVehicleUpdates(since: string): Promise<{ data: VehicleUpdate[]; error: any }> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, device_id, device_name, last_position, updated_at, owner_id')
    .gte('updated_at', since)
    .order('updated_at', { ascending: false })
    .limit(50);

  return {
    data: data ?? [],
    error
  };
}

// Get GP51 session token - direct table query for most recent active session
export async function getGP51SessionToken(): Promise<{ data: Gp51Token | null; error: any }> {
  const { data, error } = await supabase
    .from('gp51_sessions')
    .select('id, envio_user_id, gp51_username, gp51_token, token_expires_at, is_active, created_at')
    .eq('is_active', true)
    .not('gp51_token', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Return single object or null instead of array
  return {
    data: data || null,
    error
  };
}
