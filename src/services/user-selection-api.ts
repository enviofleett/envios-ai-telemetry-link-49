
import { supabase } from '@/integrations/supabase/client';

export interface SelectableUser {
  id: string;
  name: string;
  email: string;
  registration_status: string;
  created_at: string;
}

export const fetchSelectableUsers = async (): Promise<SelectableUser[]> => {
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) {
    throw new Error('Admin not authenticated');
  }

  const { data, error } = await supabase
    .from('envio_users')
    .select('id, name, email, registration_status, created_at')
    .order('name');

  if (error) {
    throw error;
  }

  return data || [];
};
