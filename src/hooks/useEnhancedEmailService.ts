
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  template_type: string | null;
  smtp_config_id: string | null;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const useEnhancedEmailService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch email logs
  const { 
    data: emailLogs, 
    isLoading: isLoadingLogs,
    error: logsError,
    refetch: refreshLogs 
  } = useQuery({
    queryKey: ['email-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch email logs:', error);
        throw error;
      }

      // Transform data to match interface, providing defaults for missing fields
      return (data || []).map(log => ({
        id: log.id,
        recipient_email: log.recipient_email,
        subject: log.subject,
        template_type: log.template_type,
        smtp_config_id: log.smtp_config_id,
        status: log.status,
        sent_at: log.sent_at,
        delivered_at: null, // Set default as this field doesn't exist in DB
        error_message: log.error_message,
        created_at: log.created_at,
        updated_at: log.created_at // Use created_at as fallback
      })) as EmailLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get email statistics
  const getEmailStats = () => {
    if (!emailLogs) {
      return {
        total: 0,
        sent: 0,
        failed: 0,
        deliveryRate: 0
      };
    }

    const total = emailLogs.length;
    const sent = emailLogs.filter(log => log.status === 'sent').length;
    const failed = emailLogs.filter(log => log.status === 'failed').length;
    const deliveryRate = total > 0 ? ((sent / total) * 100) : 0;

    return {
      total,
      sent,
      failed,
      deliveryRate
    };
  };

  // Get logs by template type
  const getLogsByTemplate = (templateType: string) => {
    if (!emailLogs) return [];
    return emailLogs.filter(log => log.template_type === templateType);
  };

  // Get recent failed emails
  const getRecentFailures = (hours = 24) => {
    if (!emailLogs) return [];
    
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    
    return emailLogs.filter(log => 
      log.status === 'failed' && 
      new Date(log.created_at) > cutoff
    );
  };

  return {
    emailLogs: emailLogs || [],
    isLoadingLogs,
    logsError,
    refreshLogs,
    getEmailStats,
    getLogsByTemplate,
    getRecentFailures
  };
};
