
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface DashboardRefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated?: Date;
}

const DashboardRefreshButton: React.FC<DashboardRefreshButtonProps> = ({
  onRefresh,
  isLoading,
  lastUpdated
}) => {
  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="outline" 
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh Data
      </Button>
      
      {lastUpdated && (
        <span className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default DashboardRefreshButton;
