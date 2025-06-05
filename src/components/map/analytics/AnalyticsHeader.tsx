
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';

interface AnalyticsHeaderProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  onRefresh: () => void;
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ 
  dateRange, 
  onDateRangeChange, 
  onRefresh 
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Map Analytics Dashboard</h2>
        <p className="text-gray-600">Monitor map usage and performance metrics</p>
      </div>
      <div className="flex items-center gap-4">
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onRefresh} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
