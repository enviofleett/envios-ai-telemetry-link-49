
import React from 'react';
import { ExtractionJob } from '@/types/extraction';

interface JobDetailsProps {
  job: ExtractionJob;
}

const JobDetails: React.FC<JobDetailsProps> = ({ job }) => {
  return (
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
          <h4 className="font-medium text-red-600 mb-2">Failed Accounts ({job.error_log.length})</h4>
          <div className="bg-red-50 p-3 rounded max-h-40 overflow-y-auto">
            {job.error_log.map((error: any, index: number) => (
              <div key={index} className="text-sm mb-2">
                <strong>{error.username}:</strong> {error.error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
