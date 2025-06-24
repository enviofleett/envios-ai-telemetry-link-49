
import { useQuery } from '@tanstack/react-query';
import { fetchDeviceSubscriptions, DeviceSubscription } from '@/services/billing/billingStatsService';
import { VehicleData } from '@/types/vehicle';
import { ActiveService, ServiceStats, ServiceUpdateRequest, getServiceIcon, EnhancedDeviceSubscription } from '@/types/active-services';
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
    
    // Create an enhanced DeviceSubscription with UI-expected properties
    const enhancedDeviceSubscription: EnhancedDeviceSubscription = {
      ...subscription,
      subscription_status: subscription.status === 'active' ? 'active' : 'expired',
      billing_cycle: 'monthly',
      auto_renewal: true,
      discount_percentage: 0
    };
    
    return {
      id: subscription.id,
      name: subscription.subscription_type,
      serviceName: subscription.subscription_type,
      type: 'subscription',
      serviceType: 'telemetry' as const,
      vehicles: vehicle ? [{
        id: vehicle.id,
        plateNumber: vehicle.license_plate || vehicle.device_name,
        model: vehicle.model || 'Unknown',
        activatedDate: subscription.start_date,
        status: subscription.status === 'active' ? 'active' : 'paused'
      }] : [],
      status: subscription.status as 'active' | 'paused' | 'expired' | 'pending',
      vehicle: vehicleName,
      nextRenewal: subscription.end_date || 'N/A',
      cost: 0,
      activatedDate: subscription.start_date,
      expiryDate: subscription.end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyFee: 29.99,
      totalSpent: 359.88,
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
      deviceSubscription: enhancedDeviceSubscription
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
  };

  const handleCancelService = async (serviceId: string) => {
    console.log('Cancelling service:', serviceId);
  };

  const handleRenewService = async (serviceId: string) => {
    console.log('Renewing service:', serviceId);
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
