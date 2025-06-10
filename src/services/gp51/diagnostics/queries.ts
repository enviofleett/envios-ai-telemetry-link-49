
import { untypedSupabase } from './untypedClient';
import type { GP51Session, VehicleSample, VehicleUpdate, Gp51Token } from './types';

// Get active GP51 sessions - use untyped client with explicit column selection
export async function getActiveGP51Sessions(): Promise<{ data: GP51Session[]; error: any }> {
  const { data, error } = await untypedSupabase
    .from('gp51_sessions')
    .select('id, created_at, envio_user_id, gp51_token, is_active')
    .eq('is_active', true)
    .not('gp51_token', 'is', null);

  if (error) {
    return { data: [], error };
  }

  // Safely cast and map the data
  const rawData = data as any[];
  const mappedData: GP51Session[] = (rawData || []).map((row: any) => ({
    id: row.id,
    status: row.gp51_token ? 'active' : 'inactive',
    created_at: row.created_at,
    user_id: row.envio_user_id || ''
  }));

  return { data: mappedData, error: null };
}

// Get vehicle data sample - use untyped client with explicit column selection
export async function getVehicleDataSample(): Promise<{ data: VehicleSample[]; error: any }> {
  const { data, error } = await untypedSupabase
    .from('vehicles')
    .select('id, device_id, device_name, last_position, updated_at, is_active')
    .eq('is_active', true)
    .limit(10);

  if (error) {
    return { data: [], error };
  }

  // Safely cast and map the data
  const rawData = data as any[];
  const mappedData: VehicleSample[] = (rawData || []).map((row: any) => ({
    id: row.id,
    vehicle_id: row.device_id,
    sample_data: JSON.stringify(row.last_position || {}),
    recorded_at: row.updated_at
  }));

  return { data: mappedData, error: null };
}

// Get recent vehicle updates - use untyped client with explicit column selection
export async function getRecentVehicleUpdates(since: string): Promise<{ data: VehicleUpdate[]; error: any }> {
  const { data, error } = await untypedSupabase
    .from('vehicles')
    .select('id, device_id, device_name, last_position, updated_at')
    .gte('updated_at', since)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    return { data: [], error };
  }

  // Safely cast and map the data
  const rawData = data as any[];
  const mappedData: VehicleUpdate[] = (rawData || []).map((row: any) => ({
    id: row.id,
    vehicle_id: row.device_id,
    update_details: `Updated: ${row.device_name || row.device_id}`,
    updated_at: row.updated_at
  }));

  return { data: mappedData, error: null };
}

// Get GP51 session token - use untyped client with explicit column selection
export async function getGP51SessionToken(): Promise<{ data: Gp51Token | null; error: any }> {
  const { data, error } = await untypedSupabase
    .from('gp51_sessions')
    .select('id, gp51_token, created_at, token_expires_at, is_active')
    .eq('is_active', true)
    .not('gp51_token', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  // Safely cast and map the data
  const rawData = data as any;
  const mappedData: Gp51Token = {
    id: rawData.id,
    token: rawData.gp51_token || '',
    created_at: rawData.created_at,
    expires_at: rawData.token_expires_at || ''
  };

  return { data: mappedData, error: null };
}
