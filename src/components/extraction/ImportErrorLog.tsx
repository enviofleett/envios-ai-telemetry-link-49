
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ParsedErrorLog } from '@/types/import-job';

interface ImportErrorLogProps {
  errorLog: ParsedErrorLog[];
}

const ImportErrorLog: React.FC<ImportErrorLogProps> = ({ errorLog }) => {
  if (errorLog.length === 0) return null;

  return (
    <div className="bg-red-50 p-3 rounded-lg">
      <div className="font-medium text-red-800 mb-2 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Recent Errors:
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {errorLog.slice(-3).map((error, index) => (
          <div key={index} className="text-sm text-red-600">
            <strong>{error.username}:</strong> {error.error}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImportErrorLog;
