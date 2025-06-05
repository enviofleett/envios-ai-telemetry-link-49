
import React from 'react';
import { Button } from '@/components/ui/button';
import { Car, MapPin } from 'lucide-react';

interface LiveTrackingHeaderProps {
  viewMode: 'cards' | 'map';
  onViewModeChange: (mode: 'cards' | 'map') => void;
}

const LiveTrackingHeader: React.FC<LiveTrackingHeaderProps> = ({
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
        <p className="text-gray-600 mt-2">
          Real-time vehicle location and status monitoring
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'cards' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('cards')}
        >
          <Car className="h-4 w-4 mr-2" />
          Cards
        </Button>
        <Button
          variant={viewMode === 'map' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('map')}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Map
        </Button>
      </div>
    </div>
  );
};

export default LiveTrackingHeader;
