
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GP51LiveData, GP51LiveImportConfig, GP51LiveImportJob } from './types';

export const useGP51ImportManager = () => {
  const [importJob, setImportJob] = useState<GP51LiveImportJob | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const startImport = useCallback(async (liveData: GP51LiveData, importConfig: GP51LiveImportConfig) => {
    if (!liveData || !importConfig) {
      toast({
        title: "Import Error",
        description: "No data or configuration available for import",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsImporting(true);
      console.log('Starting GP51 live data import...');

      // Create import job
      const { data: jobData, error: jobError } = await supabase.functions.invoke('gp51-live-import', {
        body: {
          action: 'start_import',
          liveData,
          importConfig
        }
      });

      if (jobError) throw jobError;

      setImportJob(jobData.job);

      toast({
        title: "Import Started",
        description: "GP51 live data import has been initiated"
      });

      // Poll for progress updates
      const pollProgress = async () => {
        try {
          const { data: progressData } = await supabase.functions.invoke('gp51-live-import', {
            body: {
              action: 'get_progress',
              jobId: jobData.job.id
            }
          });

          if (progressData?.job) {
            setImportJob(progressData.job);
            
            if (progressData.job.status === 'completed' || progressData.job.status === 'failed') {
              setIsImporting(false);
              toast({
                title: progressData.job.status === 'completed' ? "Import Completed" : "Import Failed",
                description: progressData.job.status === 'completed' 
                  ? `Successfully imported ${progressData.job.successfulItems} items`
                  : `Import failed after processing ${progressData.job.processedItems} items`,
                variant: progressData.job.status === 'failed' ? "destructive" : "default"
              });
              return;
            }
          }

          // Continue polling if still processing
          setTimeout(pollProgress, 2000);
        } catch (error) {
          console.error('Failed to poll import progress:', error);
        }
      };

      // Start polling after a short delay
      setTimeout(pollProgress, 1000);

    } catch (error) {
      console.error('Failed to start GP51 import:', error);
      setIsImporting(false);
      toast({
        title: "Import Failed",
        description: error.message || "Could not start import process",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    importJob,
    isImporting,
    startImport,
    setImportJob,
    setIsImporting
  };
};
