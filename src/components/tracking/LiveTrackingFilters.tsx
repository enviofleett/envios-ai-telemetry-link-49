
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LiveTrackingFiltersProps {
  statusFilter: 'all' | 'online' | 'offline' | 'alerts';
  onStatusFilterChange: (status: 'all' | 'online' | 'offline' | 'alerts') => void;
}

const LiveTrackingFilters: React.FC<LiveTrackingFiltersProps> = ({
  statusFilter,
  onStatusFilterChange
}) => {
  const filterOptions = [
    { value: 'all', label: 'All Vehicles', color: 'default' },
    { value: 'online', label: 'Online', color: 'default' },
    { value: 'offline', label: 'Offline', color: 'secondary' },
    { value: 'alerts', label: 'With Alerts', color: 'destructive' }
  ] as const;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Filter by Status
        </label>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange(option.value)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingFilters;
