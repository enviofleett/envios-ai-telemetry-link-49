
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedEmailTemplate {
  id: string;
  template_type: string;
  template_category: string;
  template_name: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  is_active: boolean;
  is_system_template: boolean;
  placeholders: string[];
  template_variables: Record<string, any>;
  priority_level: string;
  language_code: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface AdminEmailTestLog {
  id: string;
  admin_user_id: string;
  template_id: string | null;
  test_type: string;
  recipient_emails: string[];
  test_data: Record<string, any>;
  success_count: number;
  failure_count: number;
  test_results: Record<string, any>;
  created_at: string;
  completed_at: string | null;
}

export const useEnhancedEmailTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all email templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['enhanced-email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enhanced_email_templates')
        .select('*')
        .order('template_category', { ascending: true })
        .order('template_name', { ascending: true });
      
      if (error) throw error;
      return data as EnhancedEmailTemplate[];
    },
  });

  // Fetch test logs
  const { data: testLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['admin-email-test-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_email_test_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as AdminEmailTestLog[];
    },
  });

  // Send test email
  const sendTestEmail = useMutation({
    mutationFn: async ({
      templateId,
      recipientEmails,
      testData,
      testType = 'single'
    }: {
      templateId: string;
      recipientEmails: string[];
      testData: Record<string, any>;
      testType?: string;
    }) => {
      console.log('🧪 Sending test email with template:', templateId);
      
      // Get template details
      const template = templates?.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Replace placeholders in template
      let subject = template.subject;
      let htmlContent = template.body_html || '';
      let textContent = template.body_text || '';

      // Replace placeholders with test data
      Object.entries(testData).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
        htmlContent = htmlContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
        textContent = textContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
      });

      // Send test emails
      const results = await Promise.allSettled(
        recipientEmails.map(async (email) => {
          const { data, error } = await supabase.functions.invoke('smtp-email-service', {
            body: {
              action: 'send-email',
              recipientEmail: email,
              subject,
              htmlContent,
              textContent,
              templateType: 'test_email',
              metadata: {
                templateId,
                testType,
                isTestEmail: true
              }
            }
          });

          if (error) throw error;
          if (!data.success) throw new Error(data.error || 'Failed to send test email');
          
          return { email, success: true, data };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Log test results
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        await supabase.from('admin_email_test_logs').insert({
          admin_user_id: user.user.id,
          template_id: templateId,
          test_type: testType,
          recipient_emails: recipientEmails,
          test_data: testData,
          success_count: successful,
          failure_count: failed,
          test_results: {
            results: results.map((r, i) => ({
              email: recipientEmails[i],
              status: r.status,
              ...(r.status === 'rejected' ? { error: r.reason?.message } : {})
            }))
          },
          completed_at: new Date().toISOString()
        });
      }

      return { successful, failed, total: recipientEmails.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Sent",
        description: `Successfully sent ${data.successful} test emails${data.failed > 0 ? `, ${data.failed} failed` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-email-test-logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Test Email Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    }
  });

  // Bulk test emails
  const sendBulkTestEmails = useMutation({
    mutationFn: async ({
      templateIds,
      recipientEmails,
      testDataSet
    }: {
      templateIds: string[];
      recipientEmails: string[];
      testDataSet: Record<string, any>[];
    }) => {
      const results = [];
      
      for (const templateId of templateIds) {
        for (const testData of testDataSet) {
          const result = await sendTestEmail.mutateAsync({
            templateId,
            recipientEmails,
            testData,
            testType: 'bulk'
          });
          results.push({ templateId, ...result });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const totalSent = results.reduce((sum, r) => sum + r.successful, 0);
      toast({
        title: "Bulk Test Complete",
        description: `Sent ${totalSent} test emails across ${results.length} template variations`,
      });
    }
  });

  // Generate sample test data for a template
  const generateSampleData = (template: EnhancedEmailTemplate): Record<string, any> => {
    const sampleData: Record<string, any> = {};
    
    template.placeholders.forEach(placeholder => {
      switch (placeholder) {
        case 'vehicle_name':
          sampleData[placeholder] = 'Test Vehicle #001';
          break;
        case 'device_id':
          sampleData[placeholder] = 'DEV-12345';
          break;
        case 'user_name':
          sampleData[placeholder] = 'John Doe';
          break;
        case 'user_email':
          sampleData[placeholder] = 'john.doe@example.com';
          break;
        case 'company_name':
          sampleData[placeholder] = 'Sample Fleet Company';
          break;
        case 'current_speed':
          sampleData[placeholder] = '85';
          break;
        case 'speed_limit':
          sampleData[placeholder] = '60';
          break;
        case 'location':
          sampleData[placeholder] = 'Main Street, Downtown';
          break;
        case 'battery_level':
          sampleData[placeholder] = '15';
          break;
        case 'geofence_name':
          sampleData[placeholder] = 'Customer Site A';
          break;
        case 'maintenance_type':
          sampleData[placeholder] = 'Oil Change';
          break;
        case 'due_date':
          sampleData[placeholder] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
          break;
        default:
          sampleData[placeholder] = `Sample ${placeholder.replace(/_/g, ' ')}`;
      }
    });

    return sampleData;
  };

  return {
    templates,
    testLogs,
    isLoadingTemplates,
    isLoadingLogs,
    sendTestEmail: sendTestEmail.mutateAsync,
    sendBulkTestEmails: sendBulkTestEmails.mutateAsync,
    generateSampleData,
    isTestingEmail: sendTestEmail.isPending,
    isBulkTesting: sendBulkTestEmails.isPending,
  };
};
