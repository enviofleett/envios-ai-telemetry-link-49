
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/services/billingApi';
import { CreateSubscriptionRequest, UpdateSubscriptionRequest } from '@/types/billing';
import { toast } from 'sonner';

export const useBillingManagement = () => {
  const queryClient = useQueryClient();
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);

  // Service Plans
  const { data: servicePlans, isLoading: servicePlansLoading } = useQuery({
    queryKey: ['service-plans'],
    queryFn: billingApi.getServicePlans
  });

  // Device Subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['device-subscriptions'],
    queryFn: billingApi.getDeviceSubscriptions
  });

  // Invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: billingApi.getInvoices
  });

  // Payment Methods
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: billingApi.getPaymentMethods
  });

  // Dashboard Stats
  const { data: dashboardStats, isLoading: dashboardStatsLoading } = useQuery({
    queryKey: ['billing-dashboard-stats'],
    queryFn: billingApi.getBillingDashboardStats
  });

  // Create Subscription Mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: (subscription: CreateSubscriptionRequest) => 
      billingApi.createDeviceSubscription(subscription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-dashboard-stats'] });
      toast.success('Subscription created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create subscription: ' + error.message);
    }
  });

  // Update Subscription Mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSubscriptionRequest }) =>
      billingApi.updateDeviceSubscription(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-dashboard-stats'] });
      toast.success('Subscription updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update subscription: ' + error.message);
    }
  });

  // Cancel Subscription Mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: billingApi.cancelDeviceSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-dashboard-stats'] });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to cancel subscription: ' + error.message);
    }
  });

  // Renew Subscription Mutation
  const renewSubscriptionMutation = useMutation({
    mutationFn: ({ id, newEndDate }: { id: string; newEndDate: string }) =>
      billingApi.renewDeviceSubscription(id, newEndDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-dashboard-stats'] });
      toast.success('Subscription renewed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to renew subscription: ' + error.message);
    }
  });

  // Helper functions
  const getSubscriptionByDeviceId = (deviceId: string) => {
    return subscriptions?.find(sub => sub.device_id === deviceId);
  };

  const getActiveSubscriptions = () => {
    return subscriptions?.filter(sub => sub.subscription_status === 'active') || [];
  };

  const getExpiringSubscriptions = (days: number = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return subscriptions?.filter(sub => {
      const endDate = new Date(sub.end_date);
      return endDate <= futureDate && sub.subscription_status === 'active';
    }) || [];
  };

  const getOverdueInvoices = () => {
    return invoices?.filter(inv => inv.status === 'overdue') || [];
  };

  const createSubscription = (subscription: CreateSubscriptionRequest) => {
    return createSubscriptionMutation.mutateAsync(subscription);
  };

  const updateSubscription = (id: string, updates: UpdateSubscriptionRequest) => {
    return updateSubscriptionMutation.mutateAsync({ id, updates });
  };

  const cancelSubscription = (id: string) => {
    return cancelSubscriptionMutation.mutateAsync(id);
  };

  const renewSubscription = (id: string, newEndDate: string) => {
    return renewSubscriptionMutation.mutateAsync({ id, newEndDate });
  };

  return {
    // Data
    servicePlans,
    subscriptions,
    invoices,
    paymentMethods,
    dashboardStats,
    
    // Loading states
    isLoading: servicePlansLoading || subscriptionsLoading || invoicesLoading || paymentMethodsLoading,
    servicePlansLoading,
    subscriptionsLoading,
    invoicesLoading,
    paymentMethodsLoading,
    dashboardStatsLoading,
    
    // Selected state
    selectedSubscriptionId,
    setSelectedSubscriptionId,
    
    // Mutations
    createSubscriptionMutation,
    updateSubscriptionMutation,
    cancelSubscriptionMutation,
    renewSubscriptionMutation,
    
    // Helper functions
    getSubscriptionByDeviceId,
    getActiveSubscriptions,
    getExpiringSubscriptions,
    getOverdueInvoices,
    
    // Actions
    createSubscription,
    updateSubscription,
    cancelSubscription,
    renewSubscription
  };
};
