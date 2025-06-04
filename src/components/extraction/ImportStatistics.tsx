
import React from 'react';
import { CheckCircle, X, Car, Users } from 'lucide-react';

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
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
          <CheckCircle className="w-4 h-4" />
          {successful_imports}
        </div>
        <div className="text-xs text-gray-600">Successful</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
          <X className="w-4 h-4" />
          {failed_imports}
        </div>
        <div className="text-xs text-gray-600">Failed</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
          <Car className="w-4 h-4" />
          {total_vehicles_imported}
        </div>
        <div className="text-xs text-gray-600">Vehicles</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-600 flex items-center justify-center gap-1">
          <Users className="w-4 h-4" />
          {processed_usernames}
        </div>
        <div className="text-xs text-gray-600">Processed</div>
      </div>
    </div>
  );
};

export default ImportStatistics;
