
import { useMemo } from 'react';
import { useBillingManagement } from '@/hooks/useBillingManagement';
import { useOptimizedVehicleData } from '@/hooks/useOptimizedVehicleData';
import { ActiveService, ServiceUpdateRequest } from '@/types/active-services';
import { toast } from 'sonner';
import { transformSubscriptionToActiveService } from '@/utils/service-data-transformer';
import { calculateServiceStats } from '@/utils/service-statistics';
import { mapActiveServiceToSubscriptionStatus } from '@/utils/service-status-mapping';

export const useActiveServices = () => {
  const {
    subscriptions,
    servicePlans,
    invoices,
    paymentMethods,
    dashboardStats,
    isLoading,
    updateSubscription,
    cancelSubscription,
    renewSubscription
  } = useBillingManagement();

  const vehicleDataQuery = useOptimizedVehicleData();
  const vehicles = vehicleDataQuery.vehicles || [];

  // Transform device subscriptions to active services
  const activeServices = useMemo((): ActiveService[] => {
    if (!subscriptions || !vehicles) return [];

    const context = {
      subscriptions,
      vehicles,
      invoices: invoices || [],
      servicePlans: servicePlans || []
    };

    return subscriptions.map(subscription => 
      transformSubscriptionToActiveService(subscription, context)
    );
  }, [subscriptions, servicePlans, vehicles, invoices]);

  // Service management functions
  const handleServiceUpdate = async (serviceId: string, updates: ServiceUpdateRequest) => {
    try {
      await updateSubscription(serviceId, {
        auto_renewal: updates.autoRenew,
        subscription_status: updates.status ? mapActiveServiceToSubscriptionStatus(updates.status) : undefined
      });
      toast.success('Service updated successfully');
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleCancelService = async (serviceId: string) => {
    try {
      await cancelSubscription(serviceId);
      toast.success('Service cancelled successfully');
    } catch (error) {
      console.error('Error cancelling service:', error);
      toast.error('Failed to cancel service');
    }
  };

  const handleRenewService = async (serviceId: string, newEndDate: string) => {
    try {
      await renewSubscription(serviceId, newEndDate);
      toast.success('Service renewed successfully');
    } catch (error) {
      console.error('Error renewing service:', error);
      toast.error('Failed to renew service');
    }
  };

  // Calculate statistics
  const stats = useMemo(() => calculateServiceStats(activeServices), [activeServices]);

  return {
    activeServices,
    stats,
    paymentMethods,
    isLoading: isLoading || vehicleDataQuery.isLoading,
    handleServiceUpdate,
    handleCancelService,
    handleRenewService
  };
};
