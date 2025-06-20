
import { useState, useCallback } from 'react';
import { reportTemplatesService, type ReportTemplate } from '@/services/reports/reportTemplatesService';
import { scheduledReportsService, type ScheduledReport } from '@/services/reports/scheduledReportsService';
import { useToast } from '@/hooks/use-toast';

export const useReportsManagement = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await reportTemplatesService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load report templates.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createTemplate = useCallback(async (template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const newTemplate = await reportTemplatesService.createTemplate(template);
      setTemplates(prev => [newTemplate, ...prev]);
      toast({
        title: "Template Created",
        description: "Report template created successfully."
      });
      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create report template.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<ReportTemplate>) => {
    try {
      const updatedTemplate = await reportTemplatesService.updateTemplate(id, updates);
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      toast({
        title: "Template Updated",
        description: "Report template updated successfully."
      });
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update report template.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await reportTemplatesService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Template Deleted",
        description: "Report template deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete report template.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const loadScheduledReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await scheduledReportsService.getScheduledReports();
      setScheduledReports(data);
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduled reports.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createScheduledReport = useCallback(async (report: Omit<ScheduledReport, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const newReport = await scheduledReportsService.createScheduledReport(report);
      setScheduledReports(prev => [newReport, ...prev]);
      toast({
        title: "Scheduled Report Created",
        description: "Scheduled report created successfully."
      });
      return newReport;
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      toast({
        title: "Error",
        description: "Failed to create scheduled report.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const executeScheduledReport = useCallback(async (reportId: string) => {
    try {
      await scheduledReportsService.executeScheduledReport(reportId);
      toast({
        title: "Report Executed",
        description: "Scheduled report executed successfully."
      });
      // Reload executions to show the new one
      loadExecutions();
    } catch (error) {
      console.error('Error executing scheduled report:', error);
      toast({
        title: "Error",
        description: "Failed to execute scheduled report.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const loadExecutions = useCallback(async (reportId?: string) => {
    try {
      const data = await scheduledReportsService.getReportExecutions(reportId);
      setExecutions(data);
    } catch (error) {
      console.error('Error loading executions:', error);
      toast({
        title: "Error",
        description: "Failed to load report executions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const initializeSystemTemplates = useCallback(async () => {
    try {
      await reportTemplatesService.createSystemTemplates();
      await loadTemplates();
    } catch (error) {
      console.error('Error initializing system templates:', error);
    }
  }, [loadTemplates]);

  return {
    templates,
    scheduledReports,
    executions,
    isLoading,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    loadScheduledReports,
    createScheduledReport,
    executeScheduledReport,
    loadExecutions,
    initializeSystemTemplates
  };
};
