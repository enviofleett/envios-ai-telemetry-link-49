
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImportJob } from '@/types/import-job';
import { getCurrentStep, getStepDetails } from '@/utils/import-job-utils';

interface PerformanceStats {
  avgProcessingTime: number;
  estimatedCompletion: Date | null;
  currentUserRate: number;
}

export const useImportJobMonitor = (jobId?: string, onJobComplete?: () => void) => {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [stats, setStats] = useState<PerformanceStats>({
    avgProcessingTime: 0,
    estimatedCompletion: null,
    currentUserRate: 0
  });
  const { toast } = useToast();

  const calculateStats = (jobData: ImportJob) => {
    if (!jobData || jobData.status !== 'processing') return;

    const startTime = new Date(jobData.created_at).getTime();
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    
    if (jobData.processed_usernames > 0 && elapsedMinutes > 0) {
      const avgTime = elapsedMinutes / jobData.processed_usernames;
      const remainingUsers = jobData.total_usernames - jobData.processed_usernames;
      const estimatedMinutes = remainingUsers * avgTime;
      
      setStats({
        avgProcessingTime: avgTime,
        estimatedCompletion: new Date(currentTime + estimatedMinutes * 60 * 1000),
        currentUserRate: jobData.processed_usernames / elapsedMinutes
      });
    }
  };

  const loadJob = async () => {
    if (!jobId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      
      const jobData: ImportJob = {
        ...data,
        progress_percentage: data.total_usernames > 0 
          ? Math.round((data.processed_usernames / data.total_usernames) * 100) 
          : 0,
        current_step: getCurrentStep(data),
        step_details: getStepDetails(data)
      };
      
      setJob(jobData);
      setLastUpdate(new Date().toLocaleTimeString());
      calculateStats(jobData);
      
      if (data.status === 'completed' || data.status === 'failed') {
        onJobComplete?.();
      }
    } catch (error) {
      console.error('Failed to load job:', error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    loadJob();

    // Set up real-time subscription
    const channel = supabase
      .channel(`job-updates-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_import_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          console.log('Real-time job update received:', payload);
          const updatedData = payload.new;
          
          const jobData: ImportJob = {
            id: updatedData.id,
            job_name: updatedData.job_name,
            status: updatedData.status,
            total_usernames: updatedData.total_usernames,
            processed_usernames: updatedData.processed_usernames,
            successful_imports: updatedData.successful_imports,
            failed_imports: updatedData.failed_imports,
            total_vehicles_imported: updatedData.total_vehicles_imported,
            created_at: updatedData.created_at,
            updated_at: updatedData.updated_at,
            completed_at: updatedData.completed_at,
            error_log: updatedData.error_log,
            import_results: updatedData.import_results,
            admin_gp51_username: updatedData.admin_gp51_username,
            import_type: updatedData.import_type,
            imported_usernames: updatedData.imported_usernames,
            progress_percentage: updatedData.total_usernames > 0 
              ? Math.round((updatedData.processed_usernames / updatedData.total_usernames) * 100) 
              : 0,
            current_step: getCurrentStep(updatedData),
            step_details: getStepDetails(updatedData)
          };
          
          setJob(jobData);
          setLastUpdate(new Date().toLocaleTimeString());
          calculateStats(jobData);
          
          if (updatedData.status === 'completed') {
            toast({
              title: "Import Completed",
              description: `Successfully imported ${updatedData.successful_imports} users with ${updatedData.total_vehicles_imported} vehicles`,
            });
            onJobComplete?.();
          } else if (updatedData.status === 'failed') {
            toast({
              title: "Import Failed",
              description: "The import job has failed. Check the error logs for details.",
              variant: "destructive"
            });
            onJobComplete?.();
          }
        }
      )
      .subscribe();

    // Polling fallback
    const interval = setInterval(() => {
      if (job?.status === 'processing') {
        loadJob();
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [jobId, job?.status]);

  return { job, isLoading, lastUpdate, stats };
};
