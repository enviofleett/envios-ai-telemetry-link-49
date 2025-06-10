
import { supabase } from '@/integrations/supabase/client';
import type { GP51Session, VehicleSample, VehicleUpdate, Gp51Token } from './types';

// Get active GP51 sessions - use raw query to avoid type inference issues
export async function getActiveGP51Sessions(): Promise<{ data: GP51Session[]; error: any }> {
  try {
    const { data, error } = await supabase.rpc('get_active_gp51_sessions');

    if (error) {
      return { data: [], error };
    }

    // Direct type casting and manual mapping
    const mappedData: GP51Session[] = (data || []).map((row: any) => ({
      id: row.id,
      status: row.gp51_token ? 'active' : 'inactive',
      created_at: row.created_at,
      user_id: row.envio_user_id || ''
    }));

    return { data: mappedData, error: null };
  } catch (err) {
    // Fallback to direct query if RPC doesn't exist
    const query = supabase
      .from('gp51_sessions')
      .select('id, created_at, envio_user_id, gp51_token')
      .eq('is_active', true)
      .not('gp51_token', 'is', null);

    const { data, error } = await query;

    if (error) {
      return { data: [], error };
    }

    const mappedData: GP51Session[] = (data || []).map((row: any) => ({
      id: row.id,
      status: row.gp51_token ? 'active' : 'inactive',
      created_at: row.created_at,
      user_id: row.envio_user_id || ''
    }));

    return { data: mappedData, error: null };
  }
}

// Get vehicle data sample - use raw query to avoid type inference issues
export async function getVehicleDataSample(): Promise<{ data: VehicleSample[]; error: any }> {
  try {
    const { data, error } = await supabase.rpc('get_vehicle_data_sample');

    if (error) {
      return { data: [], error };
    }

    const mappedData: VehicleSample[] = (data || []).map((row: any) => ({
      id: row.id,
      vehicle_id: row.device_id,
      sample_data: JSON.stringify(row.last_position || {}),
      recorded_at: row.updated_at
    }));

    return { data: mappedData, error: null };
  } catch (err) {
    // Fallback to direct query
    const query = supabase
      .from('vehicles')
      .select('id, device_id, device_name, last_position, updated_at')
      .eq('is_active', true)
      .limit(10);

    const { data, error } = await query;

    if (error) {
      return { data: [], error };
    }

    const mappedData: VehicleSample[] = (data || []).map((row: any) => ({
      id: row.id,
      vehicle_id: row.device_id,
      sample_data: JSON.stringify(row.last_position || {}),
      recorded_at: row.updated_at
    }));

    return { data: mappedData, error: null };
  }
}

// Get recent vehicle updates - use raw query to avoid type inference issues
export async function getRecentVehicleUpdates(since: string): Promise<{ data: VehicleUpdate[]; error: any }> {
  try {
    const { data, error } = await supabase.rpc('get_recent_vehicle_updates', { since_timestamp: since });

    if (error) {
      return { data: [], error };
    }

    const mappedData: VehicleUpdate[] = (data || []).map((row: any) => ({
      id: row.id,
      vehicle_id: row.device_id,
      update_details: `Updated: ${row.device_name || row.device_id}`,
      updated_at: row.updated_at
    }));

    return { data: mappedData, error: null };
  } catch (err) {
    // Fallback to direct query
    const query = supabase
      .from('vehicles')
      .select('id, device_id, device_name, last_position, updated_at')
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;

    if (error) {
      return { data: [], error };
    }

    const mappedData: VehicleUpdate[] = (data || []).map((row: any) => ({
      id: row.id,
      vehicle_id: row.device_id,
      update_details: `Updated: ${row.device_name || row.device_id}`,
      updated_at: row.updated_at
    }));

    return { data: mappedData, error: null };
  }
}

// Get GP51 session token - use raw query to avoid type inference issues
export async function getGP51SessionToken(): Promise<{ data: Gp51Token | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc('get_gp51_session_token');

    if (error) {
      return { data: null, error };
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return { data: null, error: null };
    }

    const tokenData = data[0];
    const mappedData: Gp51Token = {
      id: tokenData.id,
      token: tokenData.gp51_token || '',
      created_at: tokenData.created_at,
      expires_at: tokenData.token_expires_at || ''
    };

    return { data: mappedData, error: null };
  } catch (err) {
    // Fallback to direct query
    const query = supabase
      .from('gp51_sessions')
      .select('id, gp51_token, created_at, token_expires_at')
      .eq('is_active', true)
      .not('gp51_token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: null };
    }

    const mappedData: Gp51Token = {
      id: data.id,
      token: data.gp51_token || '',
      created_at: data.created_at,
      expires_at: data.token_expires_at || ''
    };

    return { data: mappedData, error: null };
  }
}
