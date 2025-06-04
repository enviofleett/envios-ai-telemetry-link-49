
import { useMemo } from 'react';
import { Vehicle, VehicleStatistics } from '@/types/vehicle';

export const useVehicleStatistics = (vehicles: Vehicle[]): VehicleStatistics => {
  return useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(v => v.is_active).length;
    const online = vehicles.filter(v => {
      if (!v.last_position?.updatetime) return false;
      return new Date(v.last_position.updatetime) > new Date(Date.now() - 30 * 60 * 1000);
    }).length;
    const alerts = vehicles.filter(v => 
      v.status?.toLowerCase().includes('alert') || 
      v.status?.toLowerCase().includes('alarm')
    ).length;

    return { total, active, online, alerts };
  }, [vehicles]);
};
