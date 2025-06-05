
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Filter } from 'lucide-react';
import LiveTrackingFilters from './LiveTrackingFilters';

interface LiveTrackingControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'online' | 'offline' | 'alerts';
  onStatusFilterChange: (status: 'all' | 'online' | 'offline' | 'alerts') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const LiveTrackingControls: React.FC<LiveTrackingControlsProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  showFilters,
  onToggleFilters,
  onRefresh,
  isRefreshing
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Vehicle Tracking Controls</span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onToggleFilters}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button 
              onClick={onRefresh} 
              size="sm" 
              variant="outline"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by vehicle name or ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {showFilters && (
          <LiveTrackingFilters
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default LiveTrackingControls;
