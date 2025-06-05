
import React from 'react';
import { Progress } from '@/components/ui/progress';
import type { MapApiConfig } from './types';
import { getUsagePercentage } from './utils';

interface UsageProgressProps {
  config: MapApiConfig;
}

const UsageProgress: React.FC<UsageProgressProps> = ({ config }) => {
  const usagePercentage = getUsagePercentage(config);

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span>Usage Progress</span>
        <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
      </div>
      <Progress 
        value={Math.min(usagePercentage, 100)} 
        className="h-3"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0</span>
        <span className="text-yellow-600">80%</span>
        <span className="text-orange-600">90%</span>
        <span className="text-red-600">95%</span>
        <span>{config.threshold_value.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default UsageProgress;
