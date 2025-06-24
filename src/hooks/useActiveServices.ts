
import { useQuery } from '@tanstack/react-query';
import { fetchDeviceSubscriptions, DeviceSubscription } from '@/services/billing/billingStatsService';
import { VehicleData } from '@/types/vehicle';

export interface ServiceTransformationContext {
  subscriptions: DeviceSubscription[];
  vehicles: VehicleData[];
  invoices: any[];
  servicePlans: any[];
}

export interface ActiveService {
  id: string;
  name: string;
  type: string;
  status: string;
  vehicle: string;
  nextRenewal: string;
  cost: number;
}

const transformServicesToActiveServices = (context: ServiceTransformationContext): ActiveService[] => {
  const { subscriptions, vehicles } = context;
  
  return subscriptions.map(subscription => {
    const vehicle = vehicles.find(v => v.id === subscription.device_id);
    
    return {
      id: subscription.id,
      name: subscription.subscription_type,
      type: 'subscription',
      status: subscription.status,
      vehicle: vehicle?.name || subscription.device_id,
      nextRenewal: subscription.end_date || 'N/A',
      cost: 0 // Would come from subscription pricing
    };
  });
};

export const useActiveServices = (vehicles: VehicleData[] = []) => {
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery<DeviceSubscription[]>({
    queryKey: ['device-subscriptions'],
    queryFn: fetchDeviceSubscriptions
  });

  const { data: activeServices = [], isLoading } = useQuery<ActiveService[]>({
    queryKey: ['active-services', subscriptions, vehicles],
    queryFn: async () => {
      // Mock additional data since tables may not exist
      const mockInvoices: any[] = [];
      const mockServicePlans: any[] = [];
      
      return transformServicesToActiveServices({
        subscriptions,
        vehicles,
        invoices: mockInvoices,
        servicePlans: mockServicePlans
      });
    },
    enabled: !subscriptionsLoading
  });

  return {
    activeServices,
    isLoading: subscriptionsLoading || isLoading,
    refetch: () => {
      // Would refetch all related queries
    }
  };
};
