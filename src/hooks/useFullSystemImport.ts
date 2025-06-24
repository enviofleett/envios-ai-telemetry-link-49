
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fullSystemImportService, ImportProgress } from '@/services/fullSystemImportService';
import type { SystemImportOptions } from '@/types/system-import';

export const useFullSystemImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const { toast } = useToast();

  const startFullSystemImport = useCallback(async (options: SystemImportOptions) => {
    setIsImporting(true);
    setProgress(null);

    try {
      const result = await fullSystemImportService.startFullSystemImport(
        options,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      if (result.success) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.successfulUsers} users and ${result.successfulVehicles} vehicles`
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Import Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsImporting(false);
      setProgress(null);
    }
  }, [toast]);

  return {
    startFullSystemImport,
    isImporting,
    progress
  };
};
