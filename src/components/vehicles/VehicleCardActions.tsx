
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Map,
  History,
  Settings
} from 'lucide-react';

interface Vehicle {
  id: string;
  device_id: string;
  device_name: string;
  status?: string;
  sim_number?: string;
  notes?: string;
  is_active: boolean;
  last_position?: any;
  envio_user_id?: string;
  gp51_metadata?: any;
  created_at: string;
  updated_at: string;
}

interface VehicleCardActionsProps {
  vehicle: Vehicle;
  onViewMap: (vehicle: Vehicle) => void;
  onViewHistory: (vehicle: Vehicle) => void;
  onViewDetails: (vehicle: Vehicle) => void;
  onSendCommand?: (vehicle: Vehicle) => void;
}

const VehicleCardActions: React.FC<VehicleCardActionsProps> = ({
  vehicle,
  onViewMap,
  onViewHistory,
  onViewDetails,
  onSendCommand
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 pt-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onViewMap(vehicle)}
        className="flex items-center gap-1"
      >
        <Map className="w-3 h-3" />
        Live Map
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onViewHistory(vehicle)}
        className="flex items-center gap-1"
      >
        <History className="w-3 h-3" />
        History
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onViewDetails(vehicle)}
        className="flex items-center gap-1 col-span-1"
      >
        <Settings className="w-3 h-3" />
        Details
      </Button>
      
      {onSendCommand && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onSendCommand(vehicle)}
          className="flex items-center gap-1"
        >
          <Settings className="w-3 h-3" />
          Command
        </Button>
      )}
    </div>
  );
};

export default VehicleCardActions;
