
import { supabase } from '@/integrations/supabase/client';

export interface GP51UserMapping {
  id: string;
  envio_user_id: string;
  gp51_username: string;
  gp51_user_type: number;
  mapping_type: 'manual' | 'auto' | 'migrated';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export class GP51UserMappingService {
  static async getUserMappings(userId: string): Promise<GP51UserMapping[]> {
    const { data, error } = await supabase
      .from('gp51_user_mappings')
      .select('*')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching GP51 user mappings:', error);
      throw error;
    }

    // Cast the data to ensure proper typing since the database now returns the correct ENUM
    return (data || []) as GP51UserMapping[];
  }

  static async createMapping(
    userId: string, 
    gp51Username: string, 
    userType: number = 3,
    mappingType: 'manual' | 'auto' | 'migrated' = 'manual'
  ): Promise<GP51UserMapping> {
    const { data, error } = await supabase
      .from('gp51_user_mappings')
      .insert({
        envio_user_id: userId,
        gp51_username: gp51Username,
        gp51_user_type: userType,
        mapping_type: mappingType,
        is_verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating GP51 user mapping:', error);
      throw error;
    }

    return data as GP51UserMapping;
  }

  static async verifyMapping(mappingId: string): Promise<GP51UserMapping> {
    const { data, error } = await supabase
      .from('gp51_user_mappings')
      .update({ is_verified: true })
      .eq('id', mappingId)
      .select()
      .single();

    if (error) {
      console.error('Error verifying GP51 user mapping:', error);
      throw error;
    }

    return data as GP51UserMapping;
  }

  static async deleteMapping(mappingId: string): Promise<void> {
    const { error } = await supabase
      .from('gp51_user_mappings')
      .delete()
      .eq('id', mappingId);

    if (error) {
      console.error('Error deleting GP51 user mapping:', error);
      throw error;
    }
  }

  static async findMappingByGP51Username(gp51Username: string): Promise<GP51UserMapping | null> {
    const { data, error } = await supabase
      .from('gp51_user_mappings')
      .select('*')
      .eq('gp51_username', gp51Username)
      .eq('is_verified', true)
      .maybeSingle();

    if (error) {
      console.error('Error finding GP51 user mapping:', error);
      throw error;
    }

    return data as GP51UserMapping | null;
  }

  static async migrateExistingUsers(): Promise<void> {
    // Migrate users from envio_users.gp51_username to the new mapping table
    const { data: users, error: fetchError } = await supabase
      .from('envio_users')
      .select('id, gp51_username, gp51_user_type')
      .not('gp51_username', 'is', null)
      .neq('gp51_username', '');

    if (fetchError) {
      console.error('Error fetching users for migration:', fetchError);
      throw fetchError;
    }

    if (!users || users.length === 0) {
      console.log('No users to migrate');
      return;
    }

    const mappings = users.map(user => ({
      envio_user_id: user.id,
      gp51_username: user.gp51_username,
      gp51_user_type: user.gp51_user_type || 3,
      mapping_type: 'migrated' as const,
      is_verified: true
    }));

    const { error: insertError } = await supabase
      .from('gp51_user_mappings')
      .upsert(mappings, { onConflict: 'envio_user_id,gp51_username' });

    if (insertError) {
      console.error('Error migrating users:', insertError);
      throw insertError;
    }

    console.log(`Successfully migrated ${users.length} GP51 user mappings`);
  }
}
