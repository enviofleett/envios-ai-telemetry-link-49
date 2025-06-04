
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtractionJob } from '@/types/extraction';
import JobCard from './JobCard';

interface ExtractionJobsListProps {
  jobs: ExtractionJob[];
  expandedJobId: string | null;
  onToggleDetails: (jobId: string) => void;
  onDownloadResults: (job: ExtractionJob) => void;
}

const ExtractionJobsList: React.FC<ExtractionJobsListProps> = ({
  jobs,
  expandedJobId,
  onToggleDetails,
  onDownloadResults
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Extraction Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggleDetails={() => onToggleDetails(job.id)}
              onDownload={() => onDownloadResults(job)}
            />
          ))}

          {jobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No extraction jobs found. Start your first bulk extraction above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtractionJobsList;
