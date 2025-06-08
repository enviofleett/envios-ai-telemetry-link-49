
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ParsedErrorLog } from '@/types/import-job';

interface ImportErrorLogProps {
  errorLog: ParsedErrorLog[];
}

const ImportErrorLog: React.FC<ImportErrorLogProps> = ({ errorLog }) => {
  if (errorLog.length === 0) return null;

  return (
    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
      <div className="font-medium text-red-800 mb-3 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Recent Errors ({errorLog.length}):
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {errorLog.slice(-5).map((error: any, index: number) => (
          <div key={index} className="text-sm p-2 bg-white rounded border border-red-100">
            <div className="font-medium text-red-700">{error.username}</div>
            <div className="text-red-600 text-xs">{error.error}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(error.timestamp).toLocaleString()} 
              {error.attempts && ` (${error.attempts} attempts)`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImportErrorLog;
