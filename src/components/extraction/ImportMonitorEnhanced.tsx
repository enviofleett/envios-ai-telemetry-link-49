import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Database } from 'lucide-react';
import { parseErrorLog, convertToErrorLogEntries } from '@/utils/import-job-utils';
import { useImportJobMonitor } from '@/hooks/useImportJobMonitor';
import ImportStatusBadge from './ImportStatusBadge';
import ImportStatistics from './ImportStatistics';
import ImportErrorLog from './ImportErrorLog';
import ImportPerformanceMetrics from './ImportPerformanceMetrics';
import ImportCurrentStep from './ImportCurrentStep';
import ImportAdminInfo from './ImportAdminInfo';

interface ImportMonitorEnhancedProps {
  jobId?: string;
  onJobComplete?: () => void;
}

const ImportMonitorEnhanced: React.FC<ImportMonitorEnhancedProps> = ({ jobId, onJobComplete }) => {
  const { job, isLoading, lastUpdate, stats } = useImportJobMonitor(jobId, onJobComplete);

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

  const errorLog = convertToErrorLogEntries(parseErrorLog(job.error_log));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Enhanced Import Monitor: {job.job_name}
          </CardTitle>
          <ImportStatusBadge status={job.status} />
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
        <ImportCurrentStep 
          currentStep={job.current_step}
          stepDetails={job.step_details}
        />

        {/* Statistics Grid */}
        <ImportStatistics
          successful_imports={job.successful_imports}
          failed_imports={job.failed_imports}
          total_vehicles_imported={job.total_vehicles_imported}
          processed_usernames={job.processed_usernames}
        />

        {/* Performance Stats */}
        <ImportPerformanceMetrics stats={stats} status={job.status} />

        {/* Recent Errors */}
        <ImportErrorLog errorLog={errorLog} />

        {/* Admin Info */}
        <ImportAdminInfo job={job} lastUpdate={lastUpdate} />
      </CardContent>
    </Card>
  );
};

export default ImportMonitorEnhanced;
