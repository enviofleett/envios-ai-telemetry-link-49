
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BulkImportJob } from '@/types/bulk-import';
import { parseErrorLog, parseImportData } from '@/utils/bulk-import-utils';
import { Play, Pause, Square, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';

const EnhancedBulkImportManager: React.FC = () => {
  const [jobs, setJobs] = useState<BulkImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<BulkImportJob | null>(null);
  const { toast } = useToast();

  const loadJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the data to properly handle the types
      const mappedJobs: BulkImportJob[] = (data || []).map(job => ({
        ...job,
        status: job.status as BulkImportJob['status'],
        error_log: job.error_log,
        import_data: job.import_data
      }));

      setJobs(mappedJobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load bulk import jobs",
        variant: "destructive"
      });
    }
  };

  const startBulkImport = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: {
          action: 'start_import',
          import_type: 'gp51_vehicles',
          job_name: `GP51 Bulk Import - ${new Date().toISOString()}`,
          chunk_size: 50
        }
      });

      if (error) throw error;

      toast({
        title: "Import Started",
        description: "Bulk import job has been initiated. Monitor progress below.",
      });

      loadJobs();
    } catch (error) {
      console.error('Failed to start bulk import:', error);
      toast({
        title: "Error",
        description: "Failed to start bulk import",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: BulkImportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'completed_with_errors':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: BulkImportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'completed_with_errors':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (job: BulkImportJob) => {
    if (job.total_items === 0) return 0;
    return Math.round((job.processed_items / job.total_items) * 100);
  };

  const formatErrorLog = (job: BulkImportJob) => {
    const errors = parseErrorLog(job.error_log);
    return errors.slice(0, 3); // Show only first 3 errors
  };

  useEffect(() => {
    loadJobs();
    
    // Set up real-time subscription for job updates
    const channel = supabase
      .channel('bulk-import-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bulk_import_jobs'
        },
        () => {
          loadJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Enhanced Bulk Import Control
              </CardTitle>
              <CardDescription>
                Import all 3,822 vehicles from GP51 with advanced monitoring and error recovery
              </CardDescription>
            </div>
            <Button 
              onClick={startBulkImport} 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Starting...' : 'Start Bulk Import'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Jobs List */}
      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedJob(job)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <h3 className="font-semibold">{job.job_name}</h3>
                    <p className="text-sm text-gray-600">
                      Started: {new Date(job.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(job.status)}>
                  {job.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{calculateProgress(job)}%</span>
                </div>
                <Progress value={calculateProgress(job)} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-semibold">{job.total_items}</p>
                </div>
                <div>
                  <p className="text-gray-600">Processed</p>
                  <p className="font-semibold">{job.processed_items}</p>
                </div>
                <div>
                  <p className="text-gray-600">Successful</p>
                  <p className="font-semibold text-green-600">{job.successful_items}</p>
                </div>
                <div>
                  <p className="text-gray-600">Failed</p>
                  <p className="font-semibold text-red-600">{job.failed_items}</p>
                </div>
              </div>

              {/* Recent Errors */}
              {job.failed_items > 0 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">{job.failed_items} errors occurred:</p>
                      {formatErrorLog(job).map((error, index) => (
                        <p key={index} className="text-xs text-gray-600 truncate">
                          • {typeof error === 'string' ? error : JSON.stringify(error)}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}

        {jobs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Import Jobs</h3>
              <p className="text-gray-500">Start your first bulk import to see jobs here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedBulkImportManager;
