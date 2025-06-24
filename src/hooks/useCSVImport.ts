
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { csvImportService } from '@/services/csvImportService';
import { CSVImportJob, CSVImportTemplate, ImportPreviewData } from '@/types/csv-import';

export const useCSVImport = () => {
  const [importJobs, setImportJobs] = useState<CSVImportJob[]>([]);
  const [templates, setTemplates] = useState<CSVImportTemplate[]>([]);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const loadImportJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const jobs = await csvImportService.getImportJobs();
      setImportJobs(jobs);
    } catch (error) {
      console.error('Error loading import jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load import jobs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadTemplates = useCallback(async () => {
    try {
      const templateList = await csvImportService.getImportTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load import templates",
        variant: "destructive"
      });
    }
  }, [toast]);

  const validateCSV = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);
      
      const content = await file.text();
      const rows = await csvImportService.parseCSV(content);
      
      if (templates.length === 0) {
        await loadTemplates();
      }
      
      const template = templates.find(t => t.template_type === 'vehicle_import') || templates[0];
      if (!template) {
        throw new Error('No import template available');
      }

      const preview = await csvImportService.validateCSVData(rows, template);
      setPreviewData(preview);
      
      return preview;
    } catch (error) {
      console.error('Error validating CSV:', error);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Failed to validate CSV file",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [templates, loadTemplates, toast]);

  const createImportJob = useCallback(async (jobName: string, fileName: string, totalRows: number) => {
    try {
      const job = await csvImportService.createImportJob({
        job_name: jobName,
        file_name: fileName,
        total_rows: totalRows
      });
      
      await loadImportJobs();
      return job;
    } catch (error) {
      console.error('Error creating import job:', error);
      toast({
        title: "Error",
        description: "Failed to create import job",
        variant: "destructive"
      });
      throw error;
    }
  }, [loadImportJobs, toast]);

  const downloadTemplate = useCallback(() => {
    const template = csvImportService.generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'vehicle_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded to your computer"
    });
  }, [toast]);

  return {
    importJobs,
    templates,
    previewData,
    isLoading,
    isProcessing,
    loadImportJobs,
    loadTemplates,
    validateCSV,
    createImportJob,
    downloadTemplate,
    setPreviewData
  };
};
