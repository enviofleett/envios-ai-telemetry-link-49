
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
  const [operationProgress, setOperationProgress] = useState<{
    isActive: boolean;
    currentOperation?: string;
    progress?: number;
    estimatedTime?: string;
  }>({ isActive: false });
  const { toast } = useToast();

  const fetchPreview = useCallback(async () => {
    setIsLoadingPreview(true);
    setPreview(null);
    setOperationProgress({
      isActive: true,
      currentOperation: 'Connecting to GP51 API...',
      progress: 10,
      estimatedTime: '2-5 minutes for large datasets'
    });

    try {
      console.log('🔍 Fetching enhanced GP51 preview with extended timeout...');
      
      // Update progress
      setOperationProgress(prev => ({
        ...prev,
        currentOperation: 'Querying GP51 device tree...',
        progress: 30
      }));
      
      const previewResult = await unifiedImportService.getEnhancedPreview();
      
      // Update progress
      setOperationProgress(prev => ({
        ...prev,
        currentOperation: 'Processing response data...',
        progress: 80
      }));
      
      if (previewResult.success) {
        setPreview(previewResult);
        setOperationProgress({
          isActive: true,
          currentOperation: 'Preview completed successfully',
          progress: 100
        });
        
        // Clear progress after a short delay
        setTimeout(() => setOperationProgress({ isActive: false }), 2000);
        
        toast({
          title: "Preview Generated Successfully",
          description: `Found ${previewResult.data.summary.users} users and ${previewResult.data.summary.vehicles} vehicles available for import.`
        });
      } else {
        console.error('❌ Preview failed:', previewResult.connectionStatus.error);
        setPreview(previewResult); // Still set it to show the error state
        setOperationProgress({ isActive: false });
        
        const isTimeoutError = previewResult.connectionStatus.error?.includes('timeout');
        
        toast({
          title: isTimeoutError ? "Large Dataset Processing" : "Preview Generation Failed",
          description: isTimeoutError 
            ? "GP51 has a large dataset (3000+ vehicles). Processing may take several minutes. Please try again shortly."
            : previewResult.connectionStatus.error || "Unable to fetch preview data from GP51",
          variant: isTimeoutError ? "default" : "destructive",
          duration: isTimeoutError ? 8000 : 5000
        });
      }
    } catch (error) {
      console.error('❌ Preview fetch exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setOperationProgress({ isActive: false });
      
      const isTimeout = errorMessage.includes('timeout');
      
      toast({
        title: isTimeout ? "Large Dataset Timeout" : "Preview Error",
        description: isTimeout 
          ? "Large dataset processing is taking longer than expected. This is normal for 3000+ vehicles. Please try again in a few minutes."
          : errorMessage,
        variant: isTimeout ? "default" : "destructive",
        duration: isTimeout ? 10000 : 5000
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
          warnings: [isTimeout ? 'Large dataset timeout - processing may take several minutes' : 'Failed to connect to preview service']
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

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const clearJob = useCallback(() => {
    setImportJob(null);
  }, []);

  return {
    preview,
    isLoadingPreview,
    isImporting,
    importJob,
    currentJob: importJob, // Add alias for compatibility
    operationProgress, // Add progress tracking
    fetchPreview,
    startImport,
    validateConnection,
    clearPreview,
    clearJob
  };
};
