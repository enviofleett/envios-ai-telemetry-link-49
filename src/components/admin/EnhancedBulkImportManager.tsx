
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';

interface ImportJob {
  id: string;
  job_name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'completed_with_errors' | 'failed';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  current_chunk: number;
  total_chunks: number;
  chunk_size: number;
  error_log: any[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  import_type: string;
  import_data?: any;
}

const EnhancedBulkImportManager: React.FC = () => {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingImport, setIsStartingImport] = useState(false);
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching import jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load import jobs",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const getProgressPercentage = (job: ImportJob) => {
    if (job.total_items === 0) return 0;
    return Math.round((job.successful_items / job.total_items) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'completed_with_errors':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed_with_errors':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const startBulkImport = async () => {
    setIsStartingImport(true);
    try {
      // Create a new import job
      const { data: newJob, error: jobError } = await supabase
        .from('bulk_import_jobs')
        .insert({
          job_name: `GP51 Vehicle Import - ${new Date().toISOString()}`,
          status: 'pending',
          total_items: 3822, // Estimated GP51 vehicles
          import_type: 'gp51_vehicles',
          chunk_size: 50
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Call the edge function to start the import
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { 
          action: 'start_import',
          jobId: newJob.id,
          chunkSize: 50
        }
      });

      if (error) throw error;

      toast({
        title: "Import Started",
        description: "GP51 vehicle import has been initiated. Monitor progress below.",
      });

      // Refresh the jobs list
      fetchJobs();

    } catch (error) {
      console.error('Error starting import:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Could not start the import process",
        variant: "destructive"
      });
    } finally {
      setIsStartingImport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import Controls
          </CardTitle>
          <CardDescription>
            Start a new bulk import of GP51 vehicles with automatic chunking and progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={startBulkImport}
              disabled={isStartingImport}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isStartingImport ? 'Starting Import...' : 'Start GP51 Import'}
            </Button>
            <Button variant="outline" onClick={fetchJobs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            Recent bulk import operations and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No import jobs found. Start your first import above.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h4 className="font-medium">{job.job_name}</h4>
                        <p className="text-sm text-gray-600">
                          Started: {new Date(job.created_at).toLocaleDateString()} at{' '}
                          {new Date(job.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {job.successful_items} / {job.total_items} vehicles</span>
                      <span>{getProgressPercentage(job)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(job)} className="w-full" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Processed:</span>
                        <span className="ml-2 font-medium">{job.processed_items}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Successful:</span>
                        <span className="ml-2 font-medium text-green-600">{job.successful_items}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Failed:</span>
                        <span className="ml-2 font-medium text-red-600">{job.failed_items}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Chunks:</span>
                        <span className="ml-2 font-medium">{job.current_chunk} / {job.total_chunks}</span>
                      </div>
                    </div>

                    {job.error_log && job.error_log.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {job.error_log.length} error(s) encountered during import.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
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
