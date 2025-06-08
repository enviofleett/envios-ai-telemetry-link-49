
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RegistrationAuditEntry {
  id: string;
  user_email: string;
  user_name: string;
  selected_role: string;
  registration_status: string;
  otp_verified: boolean;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export const useRegistrationAudit = () => {
  const [auditEntries, setAuditEntries] = useState<RegistrationAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const logRegistrationAttempt = useCallback(async (
    email: string,
    name: string,
    selectedRole: string,
    status: 'started' | 'otp_sent' | 'otp_verified' | 'completed' | 'failed',
    additionalData?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('registration_audit_log')
        .insert({
          user_email: email,
          user_name: name,
          selected_role: selectedRole,
          registration_status: status,
          otp_verified: status === 'otp_verified' || status === 'completed',
          metadata: {
            ...additionalData,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });

      if (error) {
        console.error('Failed to log registration attempt:', error);
      }
    } catch (error) {
      console.error('Error logging registration attempt:', error);
    }
  }, []);

  const loadAuditEntries = useCallback(async (limit: number = 50) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registration_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAuditEntries(data || []);
    } catch (error) {
      console.error('Failed to load audit entries:', error);
      toast({
        title: "Error",
        description: "Failed to load registration audit entries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getRegistrationStats = useCallback(async (days: number = 30) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('registration_audit_log')
        .select('registration_status, selected_role, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const stats = {
        total_attempts: data?.length || 0,
        completed_registrations: data?.filter(entry => entry.registration_status === 'completed').length || 0,
        failed_registrations: data?.filter(entry => entry.registration_status === 'failed').length || 0,
        admin_requests: data?.filter(entry => entry.selected_role === 'admin').length || 0,
        success_rate: 0
      };

      if (stats.total_attempts > 0) {
        stats.success_rate = (stats.completed_registrations / stats.total_attempts) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get registration stats:', error);
      return null;
    }
  }, []);

  return {
    auditEntries,
    loading,
    logRegistrationAttempt,
    loadAuditEntries,
    getRegistrationStats
  };
};
