
import React from 'react';

const UserTableDatabaseStatus: React.FC = () => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-700 font-medium">
          Database cleaned and ready for fresh data
        </span>
      </div>
      <p className="text-xs text-green-600 mt-1">
        All previous data has been safely backed up and the system is ready for new imports
      </p>
    </div>
  );
};

export default UserTableDatabaseStatus;
