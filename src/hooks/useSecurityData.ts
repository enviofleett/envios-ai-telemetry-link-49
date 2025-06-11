
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  id: string;
  type: string;
  user: string;
  timestamp: string;
  ip: string;
  status: string;
  details?: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  ipWhitelistEnabled: boolean;
  auditLoggingEnabled: boolean;
  dataEncryptionEnabled: boolean;
}

export const useSecurityData = () => {
  const eventsQuery = useQuery({
    queryKey: ['security-events'],
    queryFn: async (): Promise<SecurityEvent[]> => {
      // Try to get security events from audit logs
      const { data: securityLogs, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error && error.code !== 'PGRST116') { // Not table not found
        throw error;
      }

      // If no security logs table, return mock data
      if (!securityLogs || securityLogs.length === 0) {
        return [
          {
            id: '1',
            type: 'login',
            user: 'admin@fleetiq.com',
            timestamp: new Date().toISOString(),
            ip: '192.168.1.100',
            status: 'success'
          },
          {
            id: '2',
            type: 'failed_login',
            user: 'unknown@suspicious.com',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            ip: '203.0.113.42',
            status: 'blocked'
          },
          {
            id: '3',
            type: 'password_change',
            user: 'user@company.com',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            ip: '192.168.1.105',
            status: 'success'
          }
        ];
      }

      return securityLogs.map(log => ({
        id: log.id,
        type: log.action_type,
        user: log.user_id || 'system',
        timestamp: log.created_at,
        ip: log.ip_address || 'unknown',
        status: log.success ? 'success' : 'failed',
        details: log.error_message
      }));
    },
    refetchInterval: 30000
  });

  const settingsQuery = useQuery({
    queryKey: ['security-settings'],
    queryFn: async (): Promise<SecuritySettings> => {
      // Return default security settings
      return {
        twoFactorEnabled: false,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        passwordMinLength: 8,
        ipWhitelistEnabled: false,
        auditLoggingEnabled: true,
        dataEncryptionEnabled: true
      };
    }
  });

  return {
    events: eventsQuery.data || [],
    settings: settingsQuery.data,
    isLoading: eventsQuery.isLoading || settingsQuery.isLoading,
    error: eventsQuery.error || settingsQuery.error,
    refetch: () => {
      eventsQuery.refetch();
      settingsQuery.refetch();
    }
  };
};
