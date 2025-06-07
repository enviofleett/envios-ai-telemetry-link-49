
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Download,
  Eye
} from 'lucide-react';
import { CSVImportJob } from '@/types/csv-import';

interface CSVImportJobsListProps {
  jobs: CSVImportJob[];
  isLoading: boolean;
  onRefresh: () => void;
}

const CSVImportJobsList: React.FC<CSVImportJobsListProps> = ({
  jobs,
  isLoading,
  onRefresh
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading import history...
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No import jobs found. Start by uploading a CSV file.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Import History</h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {jobs.map((job) => (
        <Card key={job.id} className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(job.status)}
                <div>
                  <CardTitle className="text-base">{job.job_name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(job.status)}
                    <span className="text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{job.progress_percentage}%</div>
                {job.status === 'processing' && (
                  <div className="text-xs text-gray-500">In Progress</div>
                )}
              </div>
            </div>
            
            {job.status === 'processing' && (
              <Progress value={job.progress_percentage} className="w-full mt-3" />
            )}
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">{job.total_rows}</div>
                  <div className="text-xs text-blue-700">Total Rows</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">{job.successful_imports}</div>
                  <div className="text-xs text-green-700">Successful</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-lg font-bold text-red-600">{job.failed_imports}</div>
                  <div className="text-xs text-red-700">Failed</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-bold text-gray-600">{job.processed_rows}</div>
                  <div className="text-xs text-gray-700">Processed</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">File:</span>
                    <span className="font-medium">{job.file_name}</span>
                  </div>
                  {job.completed_at && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Completed:</span>
                      <span>{new Date(job.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {job.error_log && job.error_log.length > 0 && (
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Errors
                    </Button>
                  )}
                  {job.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  )}
                </div>
              </div>

              {job.error_log && job.error_log.length > 0 && (
                <div className="border border-red-200 rounded p-3 bg-red-50">
                  <h4 className="font-medium text-red-800 mb-2">Recent Errors:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {job.error_log.slice(0, 3).map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        Row {error.row_number}: {error.error_message}
                      </div>
                    ))}
                    {job.error_log.length > 3 && (
                      <div className="text-sm text-red-600">
                        And {job.error_log.length - 3} more errors...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CSVImportJobsList;
