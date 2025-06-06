
import React from 'react';

const DashboardLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[120px] bg-gray-very-light rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-very-light rounded-lg"></div>
          <div className="h-96 bg-gray-very-light rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLoadingSkeleton;
