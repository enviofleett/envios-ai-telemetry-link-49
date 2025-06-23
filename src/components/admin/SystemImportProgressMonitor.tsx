
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SystemImportJob } from '@/services/fullSystemImportService';

interface SystemImportProgressMonitorProps {
  refreshInterval?: number;
}

const SystemImportProgressMonitor: React.FC<SystemImportProgressMonitorProps> = ({
  refreshInterval = 5000
}) => {
  const [importJobs, setImportJobs] = useState<SystemImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();

  const fetchImportJobs = async () => {
    try {
      setIsLoading(true);
      // Mock implementation - replace with actual API call
      const mockJobs: SystemImportJob[] = [];
      setImportJobs(mockJobs);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching import jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch import jobs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImportJobs();
    const interval = setInterval(fetchImportJobs, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      running: { color: 'bg-blue-100 text-blue-800', text: 'Running' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      color: 'bg-gray-100 text-gray-800', 
      text: status 
    };
    
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Import Monitor</CardTitle>
            <CardDescription>
              Real-time monitoring of GP51 system import operations
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchImportJobs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && importJobs.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
              </div>
            ))}
          </div>
        ) : importJobs.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Imports</h3>
            <p className="text-gray-600">
              All system import operations have completed successfully.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {importJobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <h4 className="font-medium">
                      {job.import_type.replace('_', ' ').toUpperCase()} Import
                    </h4>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                {job.status === 'running' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Started:</span>{' '}
                    {new Date(job.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>{' '}
                    {new Date(job.updated_at).toLocaleString()}
                  </div>
                </div>

                {job.error_message && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">{job.error_message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemImportProgressMonitor;
