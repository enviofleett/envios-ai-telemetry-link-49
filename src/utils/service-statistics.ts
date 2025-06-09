
import { ActiveService } from '@/types/active-services';

export interface ServiceStats {
  totalMonthlySpend: number;
  totalSpent: number;
  allVehicles: Array<{ id: string; plateNumber: string; model: string }>;
  activeCount: number;
  pausedCount: number;
}

export const calculateServiceStats = (activeServices: ActiveService[]): ServiceStats => {
  const totalMonthlySpend = activeServices
    .filter(service => service.status === 'active')
    .reduce((sum, service) => sum + service.monthlyFee, 0);

  const totalSpent = activeServices
    .reduce((sum, service) => sum + service.totalSpent, 0);

  const allVehicles = Array.from(
    new Set(
      activeServices.flatMap(service =>
        service.vehicles.map(v => ({ id: v.id, plateNumber: v.plateNumber, model: v.model }))
      )
    )
  );

  return {
    totalMonthlySpend,
    totalSpent,
    allVehicles,
    activeCount: activeServices.filter(s => s.status === 'active').length,
    pausedCount: activeServices.filter(s => s.status === 'paused').length
  };
};
