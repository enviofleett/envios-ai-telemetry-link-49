
import { useMemo } from 'react';
import { Activity, Shield, Wrench, Settings } from 'lucide-react';
import { useBillingManagement } from '@/hooks/useBillingManagement';
import { useOptimizedVehicleData } from '@/hooks/useOptimizedVehicleData';
import { ActiveService, ServiceUpdateRequest } from '@/types/active-services';
import { DeviceSubscription } from '@/types/billing';
import { toast } from 'sonner';

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

  const { vehicles } = useOptimizedVehicleData();

  // Transform device subscriptions to active services
  const activeServices = useMemo((): ActiveService[] => {
    if (!subscriptions || !vehicles) return [];

    return subscriptions.map((subscription): ActiveService => {
      const servicePlan = subscription.service_plan;
      const subscriptionVehicles = vehicles.filter(v => v.deviceId === subscription.device_id);

      // Determine service type based on plan features or name
      let serviceType: 'telemetry' | 'insurance' | 'parts' | 'platform' = 'telemetry';
      if (servicePlan?.plan_name.toLowerCase().includes('insurance')) {
        serviceType = 'insurance';
      } else if (servicePlan?.plan_name.toLowerCase().includes('parts') || 
                 servicePlan?.plan_name.toLowerCase().includes('maintenance')) {
        serviceType = 'parts';
      } else if (servicePlan?.plan_name.toLowerCase().includes('platform') || 
                 servicePlan?.plan_name.toLowerCase().includes('api')) {
        serviceType = 'platform';
      }

      // Get icon based on service type
      const getServiceIcon = (type: string) => {
        switch (type) {
          case 'telemetry': return Activity;
          case 'insurance': return Shield;
          case 'parts': return Wrench;
          case 'platform': return Settings;
          default: return Activity;
        }
      };

      // Calculate pricing based on billing cycle
      let monthlyFee = 0;
      if (servicePlan) {
        switch (subscription.billing_cycle) {
          case 'monthly':
            monthlyFee = servicePlan.price_1_year ? servicePlan.price_1_year / 12 : 0;
            break;
          case 'quarterly':
            monthlyFee = servicePlan.price_1_year ? servicePlan.price_1_year / 4 : 0;
            break;
          case 'annual':
            monthlyFee = servicePlan.price_1_year || 0;
            break;
        }
      }

      // Override with custom pricing if set
      if (subscription.price_override) {
        monthlyFee = subscription.price_override;
      }

      // Apply discount
      if (subscription.discount_percentage > 0) {
        monthlyFee = monthlyFee * (1 - subscription.discount_percentage / 100);
      }

      // Calculate total spent from invoices
      const serviceInvoices = invoices?.filter(inv => 
        inv.invoice_data && 
        JSON.stringify(inv.invoice_data).includes(subscription.id)
      ) || [];
      
      const totalSpent = serviceInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      // Extract features from service plan
      const features = servicePlan?.features ? 
        Object.values(servicePlan.features).filter(f => typeof f === 'string') as string[] :
        ['Basic monitoring', 'Standard support'];

      // Calculate next billing date
      const startDate = new Date(subscription.start_date);
      const nextBillingDate = new Date(startDate);
      switch (subscription.billing_cycle) {
        case 'monthly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case 'annual':
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }

      return {
        id: subscription.id,
        serviceName: servicePlan?.plan_name || 'Unknown Service',
        serviceType,
        vehicles: subscriptionVehicles.map(v => ({
          id: v.id,
          plateNumber: v.plateNumber || v.deviceId,
          model: v.vehicleModel || 'Unknown Model',
          activatedDate: subscription.start_date,
          status: subscription.subscription_status === 'active' ? 'active' : 'paused'
        })),
        status: subscription.subscription_status,
        activatedDate: subscription.start_date,
        expiryDate: subscription.end_date,
        monthlyFee,
        totalSpent,
        lastUsed: subscription.subscription_status === 'active' ? '2 hours ago' : '1 week ago',
        features,
        icon: getServiceIcon(serviceType),
        autoRenew: subscription.auto_renewal,
        nextBillingDate: nextBillingDate.toISOString().split('T')[0],
        deviceSubscription: subscription,
        servicePlan
      };
    });
  }, [subscriptions, servicePlans, vehicles, invoices]);

  // Service management functions
  const handleServiceUpdate = async (serviceId: string, updates: ServiceUpdateRequest) => {
    try {
      await updateSubscription(serviceId, {
        auto_renewal: updates.autoRenew,
        subscription_status: updates.status
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
  const stats = useMemo(() => {
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
  }, [activeServices]);

  return {
    activeServices,
    stats,
    paymentMethods,
    isLoading,
    handleServiceUpdate,
    handleCancelService,
    handleRenewService
  };
};
