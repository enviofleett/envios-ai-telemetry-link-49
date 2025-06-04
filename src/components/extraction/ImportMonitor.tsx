
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Pause, Play, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface ImportJob {
  id: string;
  job_name: string;
  status: string;
  total_usernames: number;
  processed_usernames: number;
  successful_imports: number;
  failed_imports: number;
  total_vehicles_imported: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  error_log?: Json | null;
  import_results?: Json | null;
  admin_gp51_username?: string | null;
  import_type?: string;
  imported_usernames?: Json | null;
  // Calculated fields
  progress_percentage?: number;
  current_step?: string;
  step_details?: string;
}

interface ImportMonitorProps {
  jobId?: string;
  onJobComplete?: () => void;
}

const ImportMonitor: React.FC<ImportMonitorProps> = ({ jobId, onJobComplete }) => {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const { toast } = useToast();

  const getCurrentStep = (jobData: any): string => {
    if (jobData.status === 'completed') return 'Import Complete';
    if (jobData.status === 'failed') return 'Import Failed';
    if (jobData.status === 'processing') {
      if (jobData.processed_usernames === 0) return 'Initializing...';
      if (jobData.processed_usernames < jobData.total_usernames) return 'Processing Users';
      return 'Finalizing Import';
    }
    return 'Pending';
  };

  const getStepDetails = (jobData: any): string => {
    if (jobData.status === 'processing') {
      return `Processing user ${jobData.processed_usernames + 1} of ${jobData.total_usernames}`;
    }
    if (jobData.status === 'completed') {
      return `Successfully imported ${jobData.successful_imports} users with ${jobData.total_vehicles_imported} vehicles`;
    }
    if (jobData.status === 'failed') {
      return 'Import process encountered errors';
    }
    return '';
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
      
      // Calculate derived fields and ensure proper typing
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
      .channel('job-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_import_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          console.log('Job update received:', payload);
          // Ensure we have all required properties from the payload
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

    // Polling fallback for critical updates
    const interval = setInterval(() => {
      if (job?.status === 'processing') {
        loadJob();
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [jobId, job?.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const parseErrorLog = (errorLog: Json | null): any[] => {
    if (!errorLog) return [];
    if (Array.isArray(errorLog)) return errorLog;
    if (typeof errorLog === 'string') {
      try {
        const parsed = JSON.parse(errorLog);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  if (!jobId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No active import job to monitor
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading job details...
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-500">
          Job not found
        </CardContent>
      </Card>
    );
  }

  const errorLog = parseErrorLog(job.error_log);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            Import Monitor: {job.job_name}
          </CardTitle>
          {getStatusBadge(job.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{job.processed_usernames} / {job.total_usernames} users</span>
          </div>
          <Progress value={job.progress_percentage || 0} className="w-full" />
          <div className="text-xs text-gray-500 text-center">
            {job.progress_percentage || 0}% complete
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="font-medium text-blue-800">Current Step:</div>
          <div className="text-blue-600">{job.current_step || 'Initializing...'}</div>
          {job.step_details && (
            <div className="text-sm text-blue-500 mt-1">{job.step_details}</div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{job.successful_imports}</div>
            <div className="text-xs text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{job.failed_imports}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{job.total_vehicles_imported}</div>
            <div className="text-xs text-gray-600">Vehicles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{job.processed_usernames}</div>
            <div className="text-xs text-gray-600">Processed</div>
          </div>
        </div>

        {/* Recent Errors */}
        {errorLog.length > 0 && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="font-medium text-red-800 mb-2">Recent Errors:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {errorLog.slice(-3).map((error: any, index: number) => (
                <div key={index} className="text-sm text-red-600">
                  <strong>{error.username}:</strong> {error.error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <div>Started: {new Date(job.created_at).toLocaleString()}</div>
          <div>Last Update: {lastUpdate}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportMonitor;
