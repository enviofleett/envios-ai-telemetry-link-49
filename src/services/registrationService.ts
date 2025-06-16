
import { supabase } from '@/integrations/supabase/client';
import type { Package, RegistrationRequest, PendingRegistration } from '@/types/registration';

export class RegistrationService {
  static async getPackages(): Promise<{ success: boolean; packages?: Package[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('packages-api');
      
      if (error) throw error;
      
      return {
        success: true,
        packages: data.packages || []
      };
    } catch (error) {
      console.error('Error fetching packages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch packages'
      };
    }
  }

  static async submitRegistration(registrationData: RegistrationRequest): Promise<{ 
    success: boolean; 
    registrationId?: string; 
    error?: string; 
    message?: string; 
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('register-user', {
        body: registrationData
      });

      if (error) throw error;

      return {
        success: true,
        registrationId: data.registration_id,
        message: data.message
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  static async getPendingRegistrations(): Promise<{ 
    success: boolean; 
    registrations?: PendingRegistration[]; 
    error?: string; 
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-registration-manager', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      return {
        success: true,
        registrations: data.registrations || []
      };
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch registrations'
      };
    }
  }

  static async processRegistration(
    registrationId: string, 
    action: 'approve' | 'reject', 
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('admin-registration-manager', {
        body: {
          registration_id: registrationId,
          action,
          admin_notes: adminNotes
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Processing registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process registration'
      };
    }
  }
}
