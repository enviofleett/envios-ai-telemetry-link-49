
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { unifiedImportService } from '@/services/unifiedImportService';
import type { UnifiedImportPreview, UnifiedImportJob } from '@/services/unifiedImportService';
import type { GP51ImportOptions } from '@/types/system-import';

export const useUnifiedImport = () => {
  const [preview, setPreview] = useState<UnifiedImportPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importJob, setImportJob] = useState<UnifiedImportJob | null>(null);
  const { toast } = useToast();

  const fetchPreview = useCallback(async () => {
    setIsLoadingPreview(true);
    setPreview(null);

    try {
      console.log('🔍 Fetching enhanced GP51 preview...');
      
      const previewResult = await unifiedImportService.getEnhancedPreview();
      
      if (previewResult.success) {
        setPreview(previewResult);
        toast({
          title: "Preview Generated Successfully",
          description: `Found ${previewResult.data.summary.users} users and ${previewResult.data.summary.vehicles} vehicles available for import.`
        });
      } else {
        console.error('❌ Preview failed:', previewResult.connectionStatus.error);
        setPreview(previewResult); // Still set it to show the error state
        toast({
          title: "Preview Generation Failed",
          description: previewResult.connectionStatus.error || "Unable to fetch preview data from GP51",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Preview fetch exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Preview Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Set error state
      setPreview({
        success: false,
        data: {
          summary: { vehicles: 0, users: 0, groups: 0 },
          sampleData: { vehicles: [], users: [] },
          conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
          authentication: { connected: false, error: errorMessage },
          estimatedDuration: '0 minutes',
          warnings: ['Failed to connect to preview service']
        },
        connectionStatus: { connected: false, error: errorMessage },
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoadingPreview(false);
    }
  }, [toast]);

  const startImport = useCallback(async (options: GP51ImportOptions) => {
    if (!preview?.success) {
      toast({
        title: "Import Error",
        description: "Please generate a successful preview before starting import",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportJob(null);

    try {
      console.log('🚀 Starting unified import...');
      
      const importResult = await unifiedImportService.startUnifiedImport(options);
      
      setImportJob(importResult);

      if (importResult.status === 'completed') {
        toast({
          title: "Import Completed Successfully",
          description: `Import completed with ${importResult.results?.statistics.usersImported || 0} users and ${importResult.results?.statistics.devicesImported || 0} devices imported.`
        });
      } else if (importResult.status === 'failed') {
        toast({
          title: "Import Failed",
          description: importResult.errors.join(', ') || "Import process failed",
          variant: "destructive"
        });
      }

      return importResult;
    } catch (error) {
      console.error('❌ Import exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Import Error",
        description: errorMessage,
        variant: "destructive"
      });

      const failedJob: UnifiedImportJob = {
        id: `failed_${Date.now()}`,
        status: 'failed',
        progress: 0,
        currentPhase: 'Failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        errors: [errorMessage]
      };

      setImportJob(failedJob);
      return failedJob;
    } finally {
      setIsImporting(false);
    }
  }, [preview, toast]);

  const validateConnection = useCallback(async () => {
    try {
      console.log('🔍 Validating GP51 connection...');
      
      const validation = await unifiedImportService.validateConnection();
      
      if (validation.healthy) {
        toast({
          title: "Connection Healthy",
          description: `GP51 connection is working properly (${validation.latency}ms latency)`
        });
      } else {
        toast({
          title: "Connection Issues Detected",
          description: validation.issues.join(', '),
          variant: "destructive"
        });
      }

      return validation;
    } catch (error) {
      console.error('❌ Connection validation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Connection Validation Failed",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        healthy: false,
        issues: [errorMessage],
        recommendations: ['Check GP51 service availability and credentials']
      };
    }
  }, [toast]);

  return {
    preview,
    isLoadingPreview,
    isImporting,
    importJob,
    fetchPreview,
    startImport,
    validateConnection
  };
};
