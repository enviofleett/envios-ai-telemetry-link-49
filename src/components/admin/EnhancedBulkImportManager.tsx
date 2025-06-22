
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BulkImportJob } from '@/types/bulk-import';
import { Database, Play, Pause, Square, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const EnhancedBulkImportManager: React.FC = () => {
  const [jobs, setJobs] = useState<BulkImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type cast the data to match our BulkImportJob interface
      const typedJobs: BulkImportJob[] = (data || []).map(job => ({
        ...job,
        status: job.status as BulkImportJob['status'] // Type cast status to the correct union type
      }));
      
      setJobs(typedJobs);
    } catch (error) {
      console.error('Failed to load bulk import jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load import jobs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startBulkImport = async () => {
    try {
      setIsStarting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create a new bulk import job
      const { data: jobData, error: jobError } = await supabase
        .from('bulk_import_jobs')
        .insert({
          job_name: `GP51 Vehicle Import - ${new Date().toISOString()}`,
          status: 'pending',
          total_items: 3822, // Total GP51 vehicles
          import_type: 'gp51_vehicles',
          created_by: user.id,
          import_data: {
            source: 'gp51',
            import_all: true,
            chunk_processing: true
          }
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Call the edge function to start the import
      const { data: edgeResponse, error: edgeError } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: {
          action: 'start_import',
          jobId: jobData.id,
          importConfig: {
            source: 'gp51',
            chunkSize: 50,
            importAll: true
          }
        }
      });

      if (edgeError) throw edgeError;

      toast({
        title: "Import Started",
        description: "Enhanced bulk import has been initiated. Processing 3,822 vehicles in chunks.",
      });

      // Reload jobs to show the new one
      await loadJobs();

    } catch (error) {
      console.error('Failed to start bulk import:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Could not start bulk import process",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  const pauseJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('bulk_import_jobs')
        .update({ status: 'paused' })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Job Paused",
        description: "Import job has been paused",
      });

      await loadJobs();
    } catch (error) {
      console.error('Failed to pause job:', error);
      toast({
        title: "Error",
        description: "Failed to pause import job",
        variant: "destructive"
      });
    }
  };

  const resumeJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('bulk_import_jobs')
        .update({ status: 'running' })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Job Resumed",
        description: "Import job has been resumed",
      });

      await loadJobs();
    } catch (error) {
      console.error('Failed to resume job:', error);
      toast({
        title: "Error",
        description: "Failed to resume import job",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: BulkImportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: BulkImportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'completed_with_errors':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'default';
      case 'paused':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Enhanced Bulk Import Control
          </CardTitle>
          <CardDescription>
            Import all 3,822 vehicles from GP51 with advanced chunked processing and real-time monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will import all available vehicles from GP51 in batches of 50. 
              The process includes automatic backup creation and error recovery.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              onClick={startBulkImport} 
              disabled={isStarting || isLoading}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isStarting ? 'Starting Import...' : 'Start Enhanced Import'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadJobs}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Import Jobs</CardTitle>
          <CardDescription>Monitor and manage bulk import operations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No import jobs found. Start your first bulk import above.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <h3 className="font-medium">{job.job_name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(job.status)}>
                        {job.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {job.status === 'running' && (
                        <Button size="sm" variant="outline" onClick={() => pauseJob(job.id)}>
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}
                      {job.status === 'paused' && (
                        <Button size="sm" variant="outline" onClick={() => resumeJob(job.id)}>
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{job.processed_items} / {job.total_items}</span>
                    </div>
                    <Progress 
                      value={job.total_items > 0 ? (job.processed_items / job.total_items) * 100 : 0} 
                      className="w-full" 
                    />
                  </div>

                  {/* Chunk Progress */}
                  {job.total_chunks > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Chunk Progress</span>
                        <span>{job.current_chunk} / {job.total_chunks}</span>
                      </div>
                      <Progress 
                        value={job.total_chunks > 0 ? (job.current_chunk / job.total_chunks) * 100 : 0} 
                        className="w-full" 
                      />
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-green-600">{job.successful_items}</div>
                      <div className="text-gray-500">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-red-600">{job.failed_items}</div>
                      <div className="text-gray-500">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-blue-600">{job.chunk_size}</div>
                      <div className="text-gray-500">Chunk Size</div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Created: {new Date(job.created_at).toLocaleString()}</div>
                    {job.started_at && (
                      <div>Started: {new Date(job.started_at).toLocaleString()}</div>
                    )}
                    {job.completed_at && (
                      <div>Completed: {new Date(job.completed_at).toLocaleString()}</div>
                    )}
                  </div>

                  {/* Error Log */}
                  {job.error_log && Array.isArray(job.error_log) && job.error_log.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {job.error_log.length} error(s) occurred during import. Check logs for details.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBulkImportManager;
