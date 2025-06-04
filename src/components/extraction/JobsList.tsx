
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtractionJob } from '@/types/extraction';
import JobCard from './JobCard';

interface JobsListProps {
  jobs: ExtractionJob[];
}

const JobsList: React.FC<JobsListProps> = ({ jobs }) => {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const downloadResults = (job: ExtractionJob) => {
    if (!job.extracted_data) return;

    const blob = new Blob([JSON.stringify(job.extracted_data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.job_name}-extraction-results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleJobDetails = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extraction Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggleDetails={() => toggleJobDetails(job.id)}
              onDownload={() => downloadResults(job)}
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

export default JobsList;
