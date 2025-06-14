
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  current: number;
  previous: number;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ current, previous }) => {
  if (previous === 0) {
    if (current > 0) {
      return (
        <span className="text-xs text-muted-foreground flex items-center text-green-600">
          <ArrowUp className="h-4 w-4 mr-1" />
          New activity
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground flex items-center">
        <Minus className="h-4 w-4 mr-1" />
        No change
      </span>
    );
  }

  const percentageChange = ((current - previous) / previous) * 100;
  const isPositive = percentageChange >= 0;
  const isNeutral = Math.round(percentageChange) === 0;

  if (isNeutral) {
    return (
      <span className="text-xs text-muted-foreground flex items-center">
        <Minus className="h-4 w-4 mr-1" />
        No change
      </span>
    );
  }

  return (
    <span
      className={cn(
        'text-xs text-muted-foreground flex items-center',
        isPositive ? 'text-green-600' : 'text-red-600'
      )}
    >
      {isPositive ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
      {Math.abs(percentageChange).toFixed(0)}% vs last month
    </span>
  );
};

export default TrendIndicator;
