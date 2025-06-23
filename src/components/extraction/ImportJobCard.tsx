
import React from 'react';
import { ImportJob } from '@/types/import-job';
import ImportStatusBadge from './ImportStatusBadge';
import ImportStatistics from './ImportStatistics';
import { Progress } from '@/components/ui/progress';

interface ImportJobCardProps {
  job: ImportJob;
  isExpanded: boolean;
  onToggleDetails: (jobId: string) => void;
  onDownloadResults: (job: ImportJob) => void;
}

const ImportJobCard: React.FC<ImportJobCardProps> = ({
  job,
  isExpanded,
  onToggleDetails,
  onDownloadResults
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{job.job_name}</h3>
        <ImportStatusBadge status={job.status} />
      </div>

      <ImportStatistics
        successful_imports={job.successful_imports}
        failed_imports={job.failed_imports}
        total_vehicles_imported={job.total_vehicles_imported}
        processed_usernames={job.processed_usernames}
      />

      {job.status === 'processing' && job.progress_percentage && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{job.processed_usernames} / {job.total_usernames}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${job.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          onClick={() => onToggleDetails(job.id)}
        >
          {isExpanded ? 'Hide Details' : 'View Details'}
        </button>
        
        {job.import_results && (
          <button
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            onClick={() => onDownloadResults(job)}
          >
            Download Results
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t pt-3">
          <div className="text-sm">
            <span className="text-gray-600">Started:</span> {new Date(job.created_at).toLocaleString()}
            {job.completed_at && (
              <>
                <br />
                <span className="text-gray-600">Completed:</span> {new Date(job.completed_at).toLocaleString()}
              </>
            )}
          </div>

          {job.error_log && Array.isArray(job.error_log) && job.error_log.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 mb-2">Failed Users ({job.error_log.length})</h4>
              <div className="bg-red-50 p-3 rounded max-h-40 overflow-y-auto">
                {job.error_log.map((error: any, index: number) => (
                  <div key={index} className="text-sm mb-2">
                    <strong>{error.username}:</strong> {error.error}
                    <div className="text-xs text-gray-500">{new Date(error.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportJobCard;
