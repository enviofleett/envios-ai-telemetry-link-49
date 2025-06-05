
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ApiCredential, ApiCredentialForm } from '@/components/AdminSettings/api-credentials/types';
import { mapDatabaseRowToApiCredential } from '@/components/AdminSettings/api-credentials/types';

export const useApiCredentials = () => {
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database rows to properly typed ApiCredential objects
      const mappedCredentials = (data || []).map(mapDatabaseRowToApiCredential);
      setCredentials(mappedCredentials);
    } catch (err) {
      console.error('Error fetching API credentials:', err);
      setError('Failed to load API credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCredential = async (credential: ApiCredentialForm): Promise<ApiCredential> => {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .insert({
          ...credential,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCredentials();
      return mapDatabaseRowToApiCredential(data);
    } catch (err) {
      console.error('Error saving API credential:', err);
      throw new Error('Failed to save API credential');
    }
  };

  const updateCredential = async (id: string, credential: Partial<ApiCredentialForm>): Promise<ApiCredential> => {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .update({
          ...credential,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchCredentials();
      return mapDatabaseRowToApiCredential(data);
    } catch (err) {
      console.error('Error updating API credential:', err);
      throw new Error('Failed to update API credential');
    }
  };

  const deleteCredential = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchCredentials();
    } catch (err) {
      console.error('Error deleting API credential:', err);
      throw new Error('Failed to delete API credential');
    }
  };

  const testCredential = async (id: string): Promise<boolean> => {
    try {
      // Update last_used_at timestamp
      await supabase
        .from('api_credentials')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id);

      // Here you would implement actual credential testing logic
      // For now, we'll just return true as a placeholder
      return true;
    } catch (err) {
      console.error('Error testing API credential:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  return {
    credentials,
    isLoading,
    error,
    saveCredential,
    updateCredential,
    deleteCredential,
    testCredential,
    refetch: fetchCredentials
  };
};
