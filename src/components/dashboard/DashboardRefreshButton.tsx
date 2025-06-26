
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock } from 'lucide-react';

interface DashboardRefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date;
}

const DashboardRefreshButton: React.FC<DashboardRefreshButtonProps> = ({
  onRefresh,
  isLoading,
  lastUpdated
}) => {
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes === 0) {
      return 'Just now';
    } else if (diffMinutes === 1) {
      return '1 minute ago';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>Updated {formatLastUpdated(lastUpdated)}</span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );
};

export default DashboardRefreshButton;
