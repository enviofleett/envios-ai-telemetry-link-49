
import React from 'react';
import { Bell } from 'lucide-react';
import type { MapApiConfig } from './types';
import { getRecommendedAction } from './utils';

interface RecommendationsProps {
  config: MapApiConfig;
}

const Recommendations: React.FC<RecommendationsProps> = ({ config }) => {
  const recommendation = getRecommendedAction(config);

  return (
    <div className="p-3 bg-blue-50 rounded-lg">
      <div className="flex items-start gap-2">
        <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
        <div>
          <div className="font-medium text-blue-900">Recommendation</div>
          <div className="text-sm text-blue-700">{recommendation}</div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
