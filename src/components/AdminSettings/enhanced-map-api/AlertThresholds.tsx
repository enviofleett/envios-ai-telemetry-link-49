
import React from 'react';
import type { MapApiConfig } from './types';

interface AlertThresholdsProps {
  config: MapApiConfig;
}

const AlertThresholds: React.FC<AlertThresholdsProps> = ({ config }) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-xs text-gray-600">Warning (80%)</div>
        <div className="font-medium text-yellow-600">
          {Math.round(config.threshold_value * 0.8).toLocaleString()}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-600">High (90%)</div>
        <div className="font-medium text-orange-600">
          {Math.round(config.threshold_value * 0.9).toLocaleString()}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-600">Critical (95%)</div>
        <div className="font-medium text-red-600">
          {Math.round(config.threshold_value * 0.95).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default AlertThresholds;
