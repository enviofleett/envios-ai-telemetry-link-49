
import { useQuery } from '@tanstack/react-query';
import { fetchDeviceSubscriptions, DeviceSubscription } from '@/services/billing/billingStatsService';
import { VehicleData } from '@/types/vehicle';
import { ActiveService, ServiceStats, ServiceUpdateRequest, getServiceIcon } from '@/types/active-services';
import { calculateServiceStats } from '@/utils/service-statistics';

export interface ServiceTransformationContext {
  subscriptions: DeviceSubscription[];
  vehicles: VehicleData[];
  invoices: any[];
  servicePlans: any[];
}

const transformServicesToActiveServices = (context: ServiceTransformationContext): ActiveService[] => {
  const { subscriptions, vehicles } = context;
  
  return subscriptions.map(subscription => {
    const vehicle = vehicles.find(v => v.id === subscription.device_id);
    const vehicleName = vehicle?.name || vehicle?.device_name || subscription.device_id;
    
    return {
      id: subscription.id,
      name: subscription.subscription_type, // Legacy compatibility
      serviceName: subscription.subscription_type,
      type: 'subscription', // Legacy compatibility
      serviceType: 'telemetry' as const,
      vehicles: vehicle ? [{
        id: vehicle.id,
        plateNumber: vehicle.license_plate || vehicle.device_name,
        model: vehicle.model || 'Unknown',
        activatedDate: subscription.start_date,
        status: subscription.status === 'active' ? 'active' : 'paused'
      }] : [],
      status: subscription.status as 'active' | 'paused' | 'expired' | 'pending',
      vehicle: vehicleName, // Legacy compatibility
      nextRenewal: subscription.end_date || 'N/A', // Legacy compatibility
      cost: 0, // Legacy compatibility
      activatedDate: subscription.start_date,
      expiryDate: subscription.end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyFee: 29.99, // Mock fee
      totalSpent: 359.88, // Mock total
      lastUsed: new Date().toISOString(),
      features: ['Real-time tracking', 'Alerts', 'Reports'],
      icon: getServiceIcon('telemetry'),
      autoRenew: true,
      nextBillingDate: subscription.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageData: [
        { month: '2024-01', amount: 150 },
        { month: '2024-02', amount: 180 },
        { month: '2024-03', amount: 200 }
      ],
      deviceSubscription: subscription
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

  const stats: ServiceStats = calculateServiceStats(activeServices);

  const handleServiceUpdate = async (serviceId: string, updates: ServiceUpdateRequest) => {
    console.log('Updating service:', serviceId, updates);
    // Mock implementation - would update the service
  };

  const handleCancelService = async (serviceId: string) => {
    console.log('Cancelling service:', serviceId);
    // Mock implementation - would cancel the service
  };

  const handleRenewService = async (serviceId: string) => {
    console.log('Renewing service:', serviceId);
    // Mock implementation - would renew the service
  };

  return {
    activeServices,
    stats,
    isLoading: subscriptionsLoading || isLoading,
    handleServiceUpdate,
    handleCancelService,
    handleRenewService,
    refetch: () => {
      // Would refetch all related queries
    }
  };
};
