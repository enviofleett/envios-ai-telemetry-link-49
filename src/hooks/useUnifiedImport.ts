
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { unifiedImportService, UnifiedImportPreview, UnifiedImportJob } from '@/services/unifiedImportService';
import type { GP51ImportOptions } from '@/types/system-import';

export const useUnifiedImport = () => {
  const [preview, setPreview] = useState<UnifiedImportPreview | null>(null);
  const [currentJob, setCurrentJob] = useState<UnifiedImportJob | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const fetchPreview = useCallback(async () => {
    setIsLoadingPreview(true);
    try {
      const previewData = await unifiedImportService.getEnhancedPreview();
      setPreview(previewData);
      
      if (previewData.success) {
        toast({
          title: "Preview Generated",
          description: `Found ${previewData.data.summary.vehicles} vehicles and ${previewData.data.summary.users} users`
        });
      } else {
        toast({
          title: "Preview Failed",
          description: previewData.connectionStatus.error || "Failed to generate preview",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Preview Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPreview(false);
    }
  }, [toast]);

  const startImport = useCallback(async (options: GP51ImportOptions) => {
    setIsImporting(true);
    try {
      const job = await unifiedImportService.startUnifiedImport(options);
      setCurrentJob(job);
      
      if (job.status === 'completed') {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${job.results?.statistics.usersImported || 0} users and ${job.results?.statistics.devicesImported || 0} devices`
        });
      } else if (job.status === 'failed') {
        toast({
          title: "Import Failed",
          description: job.errors.join(', '),
          variant: "destructive"
        });
      }
      
      return job;
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsImporting(false);
    }
  }, [toast]);

  const validateConnection = useCallback(async () => {
    try {
      const validation = await unifiedImportService.validateConnection();
      
      if (validation.healthy) {
        toast({
          title: "Connection Healthy",
          description: `GP51 connection is working (${validation.latency}ms)`
        });
      } else {
        toast({
          title: "Connection Issues",
          description: validation.issues.join(', '),
          variant: "destructive"
        });
      }
      
      return validation;
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const clearJob = useCallback(() => {
    setCurrentJob(null);
  }, []);

  return {
    preview,
    currentJob,
    isLoadingPreview,
    isImporting,
    fetchPreview,
    startImport,
    validateConnection,
    clearPreview,
    clearJob
  };
};
