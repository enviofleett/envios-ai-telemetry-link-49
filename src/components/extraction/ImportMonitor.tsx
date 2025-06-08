
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Database } from 'lucide-react';
import { useImportJob } from '@/hooks/useImportJob';
import { parseErrorLog } from '@/utils/import-job-utils';
import ImportStatusBadge from './ImportStatusBadge';
import ImportStatistics from './ImportStatistics';
import ImportErrorLog from './ImportErrorLog';

interface ImportMonitorProps {
  jobId?: string;
  onJobComplete?: () => void;
}

const ImportMonitor: React.FC<ImportMonitorProps> = ({ jobId, onJobComplete }) => {
  const { job, isLoading, lastUpdate } = useImportJob(jobId, onJobComplete);

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
            <Database className="w-5 h-5" />
            Import Monitor: {job.job_name}
          </CardTitle>
          <ImportStatusBadge status={job.status} />
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
        <ImportStatistics
          successful_imports={job.successful_imports}
          failed_imports={job.failed_imports}
          total_vehicles_imported={job.total_vehicles_imported}
          processed_usernames={job.processed_usernames}
        />

        {/* Recent Errors */}
        <ImportErrorLog errorLog={errorLog} />

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
