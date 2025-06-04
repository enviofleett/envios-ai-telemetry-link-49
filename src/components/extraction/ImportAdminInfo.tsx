
import React from 'react';
import { ImportJob } from '@/types/import-job';

interface ImportAdminInfoProps {
  job: ImportJob;
  lastUpdate: string;
}

const ImportAdminInfo: React.FC<ImportAdminInfoProps> = ({ job, lastUpdate }) => {
  return (
    <div className="text-xs text-gray-500 border-t pt-3 space-y-1">
      <div className="flex justify-between">
        <span>Admin User:</span>
        <span className="font-medium">{job.admin_gp51_username || 'Unknown'}</span>
      </div>
      <div className="flex justify-between">
        <span>Started:</span>
        <span>{new Date(job.created_at).toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span>Last Update:</span>
        <span>{lastUpdate}</span>
      </div>
      {job.completed_at && (
        <div className="flex justify-between">
          <span>Completed:</span>
          <span>{new Date(job.completed_at).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default ImportAdminInfo;
