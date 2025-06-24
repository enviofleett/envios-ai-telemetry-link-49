
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportTemplatesService, type ReportTemplate } from '@/services/reports/reportTemplatesService';
import { useToast } from '@/hooks/use-toast';

export interface CreateReportTemplateData {
  name: string;
  report_type: string;
  template_config: any;
}

export const useReportsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for getting all report templates
  const { data: templates, isLoading: isLoadingTemplates, error: templatesError } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => reportTemplatesService.getTemplates(),
  });

  // Mutation for creating a report template
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: CreateReportTemplateData) => {
      // Add created_by field with a default value since the service expects it
      const templateWithCreatedBy = {
        ...templateData,
        created_by: 'current-user' // This should be replaced with actual user ID when auth is implemented
      };
      return reportTemplatesService.createTemplate(templateWithCreatedBy);
    },
    onSuccess: (result) => {
      if (result) {
        toast({
          title: 'Success',
          description: 'Report template created successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create report template',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create report template',
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating a report template
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ReportTemplate> }) =>
      reportTemplatesService.updateTemplate(id, updates),
    onSuccess: (result) => {
      if (result) {
        toast({
          title: 'Success',
          description: 'Report template updated successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update report template',
          variant: 'destructive',
        });
      }
    },
  });

  // Mutation for deleting a report template
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => reportTemplatesService.deleteTemplate(id),
    onSuccess: (success) => {
      if (success) {
        toast({
          title: 'Success',
          description: 'Report template deleted successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete report template',
          variant: 'destructive',
        });
      }
    },
  });

  // Get template by ID
  const getTemplateQuery = (id: string) => useQuery({
    queryKey: ['report-template', id],
    queryFn: () => reportTemplatesService.getTemplateById(id),
    enabled: !!id,
  });

  // Create default system templates
  const createSystemTemplatesMutation = useMutation({
    mutationFn: () => {
      // Since createSystemTemplates doesn't exist, we'll create a basic template
      const defaultTemplate: CreateReportTemplateData = {
        name: 'Default System Report',
        report_type: 'system',
        template_config: {
          sections: ['overview', 'metrics', 'alerts'],
          format: 'pdf'
        }
      };
      return reportTemplatesService.createTemplate({
        ...defaultTemplate,
        created_by: 'system'
      });
    },
    onSuccess: (result) => {
      if (result) {
        toast({
          title: 'Success',
          description: 'System templates created successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      }
    },
  });

  return {
    templates: templates || [],
    isLoadingTemplates,
    templatesError,
    getTemplate: getTemplateQuery,
    createTemplate: createTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    updateTemplate: updateTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending,
    deleteTemplate: deleteTemplateMutation.mutate,
    isDeleting: deleteTemplateMutation.isPending,
    createSystemTemplates: createSystemTemplatesMutation.mutate,
    isCreatingSystemTemplates: createSystemTemplatesMutation.isPending,
  };
};
