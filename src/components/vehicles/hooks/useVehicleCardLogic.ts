
import { useMemo } from 'react';
import { 
  WifiOff,
  AlertTriangle,
  Navigation,
  Wifi
} from 'lucide-react';

interface VehiclePosition {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

interface Vehicle {
  id: string;
  device_id: string;
  device_name: string;
  status?: string;
  sim_number?: string;
  notes?: string;
  is_active: boolean;
  last_position?: VehiclePosition;
  envio_user_id?: string;
  gp51_metadata?: any;
  created_at: string;
  updated_at: string;
}

export const useVehicleCardLogic = (vehicle: Vehicle) => {
  const statusInfo = useMemo(() => {
    if (!vehicle.is_active) {
      return { 
        status: 'Inactive', 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: WifiOff 
      };
    }
    
    const status = vehicle.status?.toLowerCase() || 'unknown';
    
    if (status.includes('alert') || status.includes('alarm')) {
      return { 
        status: 'Alert', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle 
      };
    }
    
    if (status.includes('moving')) {
      return { 
        status: 'Moving', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Navigation 
      };
    }
    
    if (status.includes('online') || status.includes('active')) {
      return { 
        status: 'Online', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Wifi 
      };
    }
    
    return { 
      status: 'Offline', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: WifiOff 
    };
  }, [vehicle.is_active, vehicle.status]);

  const isOnline = useMemo(() => {
    if (!vehicle.last_position?.updatetime) return false;
    const lastUpdate = new Date(vehicle.last_position.updatetime);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return lastUpdate > thirtyMinutesAgo;
  }, [vehicle.last_position?.updatetime]);

  const formattedLocation = useMemo(() => {
    if (!vehicle.last_position) return null;
    return `${vehicle.last_position.lat.toFixed(6)}, ${vehicle.last_position.lon.toFixed(6)}`;
  }, [vehicle.last_position]);

  const formattedLastUpdate = useMemo(() => {
    if (!vehicle.last_position?.updatetime) return null;
    
    const date = new Date(vehicle.last_position.updatetime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }, [vehicle.last_position?.updatetime]);

  return {
    statusInfo,
    isOnline,
    formattedLocation,
    formattedLastUpdate
  };
};
