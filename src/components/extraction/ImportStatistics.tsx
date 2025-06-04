
import React from 'react';
import { CheckCircle, AlertCircle, Car, Users } from 'lucide-react';

interface ImportStatisticsProps {
  successful_imports: number;
  failed_imports: number;
  total_vehicles_imported: number;
  processed_usernames: number;
}

const ImportStatistics: React.FC<ImportStatisticsProps> = ({
  successful_imports,
  failed_imports,
  total_vehicles_imported,
  processed_usernames
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
          <CheckCircle className="w-5 h-5" />
          {successful_imports}
        </div>
        <div className="text-xs text-green-700 font-medium">Successful</div>
      </div>
      <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
        <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
          <AlertCircle className="w-5 h-5" />
          {failed_imports}
        </div>
        <div className="text-xs text-red-700 font-medium">Failed</div>
      </div>
      <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
          <Car className="w-5 h-5" />
          {total_vehicles_imported}
        </div>
        <div className="text-xs text-purple-700 font-medium">Vehicles</div>
      </div>
      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-2xl font-bold text-gray-600 flex items-center justify-center gap-1">
          <Users className="w-5 h-5" />
          {processed_usernames}
        </div>
        <div className="text-xs text-gray-700 font-medium">Processed</div>
      </div>
    </div>
  );
};

export default ImportStatistics;
