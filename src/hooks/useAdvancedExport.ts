
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface ExportOptions {
  type: 'vehicles' | 'users' | 'analytics' | 'system-health';
  format: 'csv' | 'json' | 'excel';
  filters?: {
    dateRange?: { start: string; end: string };
    status?: string[];
    search?: string;
    includePositions?: boolean;
  };
  options?: {
    includeHeaders?: boolean;
    timezone?: string;
  };
}

export const useAdvancedExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const exportData = async (exportOptions: ExportOptions) => {
    try {
      setIsExporting(true);
      setProgress(25);

      console.log('🚀 Starting export:', exportOptions);

      const { data, error } = await supabase.functions.invoke('advanced-data-export', {
        body: exportOptions
      });

      setProgress(75);

      if (error) {
        throw new Error(error.message);
      }

      // Create and trigger download
      const blob = new Blob([data], { 
        type: exportOptions.format === 'json' ? 'application/json' : 'text/csv' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `${exportOptions.type}-export-${timestamp}.${exportOptions.format}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setProgress(100);

      toast({
        title: "Export Successful",
        description: `${exportOptions.type} data exported successfully as ${exportOptions.format.toUpperCase()}`,
      });

      // Reset progress after delay
      setTimeout(() => setProgress(0), 1000);

    } catch (error) {
      console.error('💥 Export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportVehicles = (format: 'csv' | 'json' | 'excel' = 'csv', filters = {}) => {
    return exportData({
      type: 'vehicles',
      format,
      filters,
      options: { includeHeaders: true }
    });
  };

  const exportUsers = (format: 'csv' | 'json' | 'excel' = 'csv') => {
    return exportData({
      type: 'users',
      format,
      options: { includeHeaders: true }
    });
  };

  const exportAnalytics = (format: 'csv' | 'json' | 'excel' = 'csv') => {
    return exportData({
      type: 'analytics',
      format,
      options: { includeHeaders: true }
    });
  };

  const exportSystemHealth = (format: 'csv' | 'json' | 'excel' = 'csv') => {
    return exportData({
      type: 'system-health',
      format,
      options: { includeHeaders: true }
    });
  };

  return {
    isExporting,
    progress,
    exportData,
    exportVehicles,
    exportUsers,
    exportAnalytics,
    exportSystemHealth
  };
};
