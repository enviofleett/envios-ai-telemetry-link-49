
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Pause, Play, X, Users, Car, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedImportJob {
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
  error_log?: any[] | null;
  import_results?: any[] | null;
  admin_gp51_username?: string | null;
  import_type?: string;
  imported_usernames?: string[] | null;
  progress_percentage?: number;
  current_step?: string;
  step_details?: string;
}

interface ImportMonitorEnhancedProps {
  jobId?: string;
  onJobComplete?: () => void;
}

const ImportMonitorEnhanced: React.FC<ImportMonitorEnhancedProps> = ({ jobId, onJobComplete }) => {
  const [job, setJob] = useState<EnhancedImportJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [stats, setStats] = useState({
    avgProcessingTime: 0,
    estimatedCompletion: null as Date | null,
    currentUserRate: 0
  });
  const { toast } = useToast();

  const loadJob = async () => {
    if (!jobId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      
      const jobData: EnhancedImportJob = {
        ...data,
        progress_percentage: data.total_usernames > 0 
          ? Math.round((data.processed_usernames / data.total_usernames) * 100) 
          : 0,
        current_step: getCurrentStep(data),
        step_details: getStepDetails(data)
      };
      
      setJob(jobData);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Calculate statistics
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

  const calculateStats = (jobData: EnhancedImportJob) => {
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
          
          const jobData: EnhancedImportJob = {
            ...updatedData,
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
    }, 3000); // More frequent updates

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [jobId, job?.status]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Processing
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Failed
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const errorLog = Array.isArray(job.error_log) ? job.error_log : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Enhanced Import Monitor: {job.job_name}
          </CardTitle>
          {getStatusBadge(job.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-gray-600">{job.processed_usernames} / {job.total_usernames} users</span>
          </div>
          <Progress value={job.progress_percentage || 0} className="w-full h-3" />
          <div className="text-xs text-gray-500 text-center">
            {job.progress_percentage || 0}% complete
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="font-medium text-blue-800 mb-1">Current Step:</div>
          <div className="text-blue-700 text-sm">{job.current_step || 'Initializing...'}</div>
          {job.step_details && (
            <div className="text-xs text-blue-600 mt-2">{job.step_details}</div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <CheckCircle className="w-5 h-5" />
              {job.successful_imports}
            </div>
            <div className="text-xs text-green-700 font-medium">Successful</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
              <X className="w-5 h-5" />
              {job.failed_imports}
            </div>
            <div className="text-xs text-red-700 font-medium">Failed</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
              <Car className="w-5 h-5" />
              {job.total_vehicles_imported}
            </div>
            <div className="text-xs text-purple-700 font-medium">Vehicles</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600 flex items-center justify-center gap-1">
              <Users className="w-5 h-5" />
              {job.processed_usernames}
            </div>
            <div className="text-xs text-gray-700 font-medium">Processed</div>
          </div>
        </div>

        {/* Performance Stats */}
        {job.status === 'processing' && stats.estimatedCompletion && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="font-medium text-yellow-800 mb-2">Performance Metrics:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-yellow-700">
              <div>
                <span className="font-medium">Avg Time/User:</span> {stats.avgProcessingTime.toFixed(1)}min
              </div>
              <div>
                <span className="font-medium">Processing Rate:</span> {stats.currentUserRate.toFixed(1)}/min
              </div>
              <div>
                <span className="font-medium">Est. Completion:</span> {stats.estimatedCompletion.toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Recent Errors */}
        {errorLog.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="font-medium text-red-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Recent Errors ({errorLog.length}):
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {errorLog.slice(-5).map((error: any, index: number) => (
                <div key={index} className="text-sm p-2 bg-white rounded border border-red-100">
                  <div className="font-medium text-red-700">{error.username}</div>
                  <div className="text-red-600 text-xs">{error.error}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(error.timestamp).toLocaleString()} 
                    {error.attempts && ` (${error.attempts} attempts)`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Info */}
        <div className="text-xs text-gray-500 border-t pt-3 space-y-1">
          <div className="flex justify-between">
            <span>Admin User:</span>
            <span className="font-medium">{job.admin_gp51_username || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span>Started:</span>
            <span>{new Date(job.created_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Update:</span>
            <span>{lastUpdate}</span>
          </div>
          {job.completed_at && (
            <div className="flex justify-between">
              <span>Completed:</span>
              <span>{new Date(job.completed_at).toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportMonitorEnhanced;
