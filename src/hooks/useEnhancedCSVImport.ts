
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { enhancedCSVImportService } from '@/services/enhancedCsvImportService';
import { 
  EnhancedImportPreviewData, 
  EnhancedCSVImportJob,
  GP51SyncStatus,
  CSVImportRelationship 
} from '@/types/enhanced-csv-import';
import { CSVImportTemplate } from '@/types/csv-import';

export const useEnhancedCSVImport = () => {
  const [importJobs, setImportJobs] = useState<EnhancedCSVImportJob[]>([]);
  const [templates, setTemplates] = useState<CSVImportTemplate[]>([]);
  const [previewData, setPreviewData] = useState<EnhancedImportPreviewData | null>(null);
  const [syncStatus, setSyncStatus] = useState<GP51SyncStatus[]>([]);
  const [relationships, setRelationships] = useState<CSVImportRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const loadEnhancedTemplates = useCallback(async () => {
    try {
      const templateList = await enhancedCSVImportService.getEnhancedTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading enhanced templates:', error);
      toast({
        title: "Error",
        description: "Failed to load enhanced import templates",
        variant: "destructive"
      });
    }
  }, [toast]);

  const validateEnhancedCSV = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);
      
      const content = await file.text();
      const preview = await enhancedCSVImportService.validateEnhancedCSV(content);
      setPreviewData(preview);
      
      toast({
        title: "Validation Complete",
        description: `Found ${preview.summary.valid_rows} valid rows, ${preview.summary.conflicts} conflicts`,
      });
      
      return preview;
    } catch (error) {
      console.error('Error validating enhanced CSV:', error);
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate CSV file",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const createEnhancedImportJob = useCallback(async (
    jobName: string, 
    fileName: string, 
    totalRows: number,
    gp51SyncEnabled: boolean = true
  ) => {
    try {
      const job = await enhancedCSVImportService.createEnhancedImportJob({
        job_name: jobName,
        file_name: fileName,
        total_rows: totalRows,
        supports_user_import: true,
        gp51_sync_enabled: gp51SyncEnabled
      });
      
      return job;
    } catch (error) {
      console.error('Error creating enhanced import job:', error);
      toast({
        title: "Error",
        description: "Failed to create enhanced import job",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const loadSyncStatus = useCallback(async (importJobId: string) => {
    try {
      const status = await enhancedCSVImportService.getSyncStatus(importJobId);
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
      toast({
        title: "Error",
        description: "Failed to load sync status",
        variant: "destructive"
      });
    }
  }, [toast]);

  const loadRelationships = useCallback(async (importJobId: string) => {
    try {
      const rels = await enhancedCSVImportService.getImportRelationships(importJobId);
      setRelationships(rels);
    } catch (error) {
      console.error('Error loading relationships:', error);
      toast({
        title: "Error",
        description: "Failed to load import relationships",
        variant: "destructive"
      });
    }
  }, [toast]);

  const downloadEnhancedTemplate = useCallback(() => {
    const template = enhancedCSVImportService.generateEnhancedCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'enhanced_user_vehicle_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Template Downloaded",
      description: "Enhanced CSV template with GP51 conformity has been downloaded"
    });
  }, [toast]);

  return {
    importJobs,
    templates,
    previewData,
    syncStatus,
    relationships,
    isLoading,
    isProcessing,
    loadEnhancedTemplates,
    validateEnhancedCSV,
    createEnhancedImportJob,
    loadSyncStatus,
    loadRelationships,
    downloadEnhancedTemplate,
    setPreviewData
  };
};
