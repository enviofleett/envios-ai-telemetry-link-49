
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface DataFreshnessIndicatorProps {
  lastUpdate?: string | Date;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  lastUpdate,
  className = '',
  showText = true,
  size = 'sm'
}) => {
  const getFreshnessStatus = () => {
    if (!lastUpdate) {
      return {
        status: 'offline',
        text: 'No Data',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: WifiOff
      };
    }

    const now = new Date();
    const updateTime = new Date(lastUpdate);
    const minutesDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60);

    if (minutesDiff < 1) {
      return {
        status: 'live',
        text: 'Live',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Wifi
      };
    } else if (minutesDiff < 5) {
      return {
        status: 'recent',
        text: `${Math.floor(minutesDiff)}m ago`,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock
      };
    } else if (minutesDiff < 30) {
      return {
        status: 'stale',
        text: `${Math.floor(minutesDiff)}m ago`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertTriangle
      };
    } else {
      return {
        status: 'offline',
        text: 'Offline',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: WifiOff
      };
    }
  };

  const { text, color, icon: IconComponent } = getFreshnessStatus();
  
  const iconSize = size === 'lg' ? 'h-4 w-4' : size === 'md' ? 'h-3 w-3' : 'h-3 w-3';
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1 ${color} ${textSize} ${className}`}
    >
      <IconComponent className={iconSize} />
      {showText && text}
    </Badge>
  );
};

export default DataFreshnessIndicator;
