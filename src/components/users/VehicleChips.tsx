
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VehicleChipsProps {
  vehicles: any[];
  onManageVehicles: () => void;
}

const VehicleChips: React.FC<VehicleChipsProps> = ({
  vehicles,
  onManageVehicles
}) => {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">No vehicles</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onManageVehicles}
          className="h-6 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Assign
        </Button>
      </div>
    );
  }

  const displayVehicles = vehicles.slice(0, 2);
  const remainingCount = vehicles.length - 2;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {displayVehicles.map((vehicle, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
              >
                <Truck className="h-3 w-3 mr-1" />
                {vehicle}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Vehicle ID: {vehicle}</p>
              <p>Status: Active</p>
              <p>Last Update: Recently</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {remainingCount > 0 && (
        <Badge 
          variant="outline" 
          className="bg-gray-50 text-gray-600 cursor-pointer hover:bg-gray-100"
          onClick={onManageVehicles}
        >
          +{remainingCount} more
        </Badge>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onManageVehicles}
        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
      >
        Manage
      </Button>
    </div>
  );
};

export default VehicleChips;
