
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportJob } from '@/types/import-job';
import ImportJobCard from './ImportJobCard';

interface ImportJobsListProps {
  importJobs: ImportJob[];
  expandedJobId: string | null;
  onToggleDetails: (jobId: string) => void;
  onDownloadResults: (job: ImportJob) => void;
}

const ImportJobsList: React.FC<ImportJobsListProps> = ({
  importJobs,
  expandedJobId,
  onToggleDetails,
  onDownloadResults
}) => {
  if (importJobs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passwordless Import Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {importJobs.map((job) => (
            <ImportJobCard
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggleDetails={onToggleDetails}
              onDownloadResults={onDownloadResults}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportJobsList;
