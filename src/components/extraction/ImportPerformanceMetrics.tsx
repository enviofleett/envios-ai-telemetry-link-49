
import React from 'react';

interface PerformanceStats {
  avgProcessingTime: number;
  estimatedCompletion: Date | null;
  currentUserRate: number;
}

interface ImportPerformanceMetricsProps {
  stats: PerformanceStats;
  status: string;
}

const ImportPerformanceMetrics: React.FC<ImportPerformanceMetricsProps> = ({ stats, status }) => {
  if (status !== 'processing' || !stats.estimatedCompletion) {
    return null;
  }

  return (
    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
      <div className="font-medium text-yellow-800 mb-2">Performance Metrics:</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-yellow-700">
        <div>
          <span className="font-medium">Avg Time/User:</span> {stats.avgProcessingTime.toFixed(1)}min
        </div>
        <div>
          <span className="font-medium">Processing Rate:</span> {stats.currentUserRate.toFixed(1)}/min
        </div>
        <div>
          <span className="font-medium">Est. Completion:</span> {stats.estimatedCompletion.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ImportPerformanceMetrics;
