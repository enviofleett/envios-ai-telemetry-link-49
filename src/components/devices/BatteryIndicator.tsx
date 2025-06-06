
import React from 'react';
import { Battery, BatteryLow, AlertTriangle } from 'lucide-react';

interface BatteryIndicatorProps {
  level: number;
}

const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({ level }) => {
  const getBatteryConfig = (level: number) => {
    if (level > 50) {
      return {
        icon: Battery,
        color: 'text-green-600',
        showWarning: false
      };
    } else if (level > 20) {
      return {
        icon: Battery,
        color: 'text-yellow-600',
        showWarning: false
      };
    } else {
      return {
        icon: BatteryLow,
        color: 'text-red-600',
        showWarning: true
      };
    }
  };

  const config = getBatteryConfig(level);
  const IconComponent = config.icon;

  return (
    <div className="flex items-center gap-1">
      <IconComponent className={`h-4 w-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {level}%
      </span>
      {config.showWarning && (
        <AlertTriangle className="h-3 w-3 text-red-500" />
      )}
    </div>
  );
};

export default BatteryIndicator;
