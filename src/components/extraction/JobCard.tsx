
import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ExtractionJob } from '@/types/extraction';
import JobDetails from './JobDetails';

interface JobCardProps {
  job: ExtractionJob;
  isExpanded: boolean;
  onToggleDetails: () => void;
  onDownload: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, isExpanded, onToggleDetails, onDownload }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{job.job_name}</h3>
        {getStatusBadge(job.status)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Total Accounts:</span>
          <p className="font-medium">{job.total_accounts}</p>
        </div>
        <div>
          <span className="text-gray-600">Successful:</span>
          <p className="font-medium text-green-600">{job.successful_accounts}</p>
        </div>
        <div>
          <span className="text-gray-600">Failed:</span>
          <p className="font-medium text-red-600">{job.failed_accounts}</p>
        </div>
        <div>
          <span className="text-gray-600">Vehicles:</span>
          <p className="font-medium">{job.total_vehicles}</p>
        </div>
      </div>

      {job.status === 'processing' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{job.processed_accounts} / {job.total_accounts}</span>
          </div>
          <Progress 
            value={(job.processed_accounts / job.total_accounts) * 100} 
            className="w-full"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDetails}
        >
          {isExpanded ? 'Hide Details' : 'View Details'}
        </Button>
        
        {job.extracted_data && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
          >
            <Download className="w-4 h-4 mr-1" />
            Download Results
          </Button>
        )}
      </div>

      {isExpanded && <JobDetails job={job} />}
    </div>
  );
};

export default JobCard;
