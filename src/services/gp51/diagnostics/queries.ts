
import { supabase } from '@/integrations/supabase/client';
import type { GP51Session, VehicleSample, VehicleUpdate, Gp51Token } from './types';

// Helper function for safe query execution with explicit typing
async function safeQuery<T>(
  queryPromise: Promise<{ data: T[] | null; error: any }>
): Promise<{ data: T[]; error: any }> {
  const result = await queryPromise;
  return {
    data: result.data ?? [],
    error: result.error
  };
}

// Get active GP51 sessions - direct table query
export async function getActiveGP51Sessions(): Promise<{ data: GP51Session[]; error: any }> {
  const queryPromise = supabase
    .from('gp51_sessions')
    .select('*')
    .eq('is_active', true)
    .not('gp51_token', 'is', null)
    .returns<GP51Session[]>();

  return safeQuery(queryPromise);
}

// Get vehicle data sample - direct table query with limit
export async function getVehicleDataSample(): Promise<{ data: VehicleSample[]; error: any }> {
  const queryPromise = supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .limit(10)
    .returns<VehicleSample[]>();

  return safeQuery(queryPromise);
}

// Get recent vehicle updates - direct table query ordered by updated_at
export async function getRecentVehicleUpdates(since: string): Promise<{ data: VehicleUpdate[]; error: any }> {
  const queryPromise = supabase
    .from('vehicles')
    .select('id, device_id, device_name, last_position, updated_at, owner_id')
    .gte('updated_at', since)
    .order('updated_at', { ascending: false })
    .limit(50)
    .returns<VehicleUpdate[]>();

  return safeQuery(queryPromise);
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
    .returns<Gp51Token[]>();

  // Return single object or null instead of array
  return {
    data: data && data.length > 0 ? data[0] : null,
    error
  };
}
