
import { supabase } from '@/integrations/supabase/client';

// Simple query functions that return plain objects
export async function getActiveGP51Sessions(): Promise<{ data: any[]; error: any }> {
  try {
    const result = await supabase.rpc('get_active_gp51_sessions');
    return { data: result.data || [], error: result.error };
  } catch (error) {
    // Fallback to direct table query if function doesn't exist
    const response = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('is_active', true);
    
    return { 
      data: response.data || [], 
      error: response.error 
    };
  }
}

export async function getVehicleDataSample(): Promise<{ data: any[]; error: any }> {
  try {
    const result = await supabase.rpc('get_vehicle_data_sample');
    return { data: result.data || [], error: result.error };
  } catch (error) {
    // Fallback to direct table query
    const response = await supabase
      .from('vehicles')
      .select('*')
      .limit(10);
    
    return { 
      data: response.data || [], 
      error: response.error 
    };
  }
}

export async function getRecentVehicleUpdates(since: string): Promise<{ data: any[]; error: any }> {
  try {
    const result = await supabase.rpc('get_recent_vehicle_updates', { since_time: since });
    return { data: result.data || [], error: result.error };
  } catch (error) {
    // Fallback to direct table query
    const response = await supabase
      .from('vehicles')
      .select('*')
      .gte('updated_at', since);
    
    return { 
      data: response.data || [], 
      error: response.error 
    };
  }
}

export async function getGP51SessionToken(): Promise<{ data: any; error: any }> {
  try {
    const result = await supabase.rpc('get_gp51_session_token');
    return { data: result.data, error: result.error };
  } catch (error) {
    // Fallback to direct table query
    const response = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('is_active', true)
      .single();
    
    return { 
      data: response.data, 
      error: response.error 
    };
  }
}
