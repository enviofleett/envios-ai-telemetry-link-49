
import { Activity, Shield, Wrench, Settings } from 'lucide-react';
import { ActiveService } from '@/types/active-services';
import { DeviceSubscription } from '@/types/billing';
import { ServiceTransformationContext } from '@/types/service-transformations';
import { mapSubscriptionToActiveServiceStatus } from './service-status-mapping';

export const determineServiceType = (servicePlan: any): ActiveService['serviceType'] => {
  if (!servicePlan?.plan_name) return 'telemetry';
  
  const planName = servicePlan.plan_name.toLowerCase();
  if (planName.includes('insurance')) return 'insurance';
  if (planName.includes('parts') || planName.includes('maintenance')) return 'parts';
  if (planName.includes('platform') || planName.includes('api')) return 'platform';
  return 'telemetry';
};

export const getServiceIcon = (type: ActiveService['serviceType']) => {
  switch (type) {
    case 'telemetry': return Activity;
    case 'insurance': return Shield;
    case 'parts': return Wrench;
    case 'platform': return Settings;
    default: return Activity;
  }
};

export const calculateMonthlyFee = (subscription: DeviceSubscription, servicePlan: any): number => {
  let monthlyFee = 0;
  
  if (servicePlan) {
    switch (subscription.billing_cycle) {
      case 'monthly':
        monthlyFee = servicePlan.price_1_year ? servicePlan.price_1_year / 12 : 0;
        break;
      case 'quarterly':
        monthlyFee = servicePlan.price_1_year ? servicePlan.price_1_year / 4 : 0;
        break;
      case 'annually':
        monthlyFee = servicePlan.price_1_year || 0;
        break;
    }
  }

  // Override with custom pricing if set (commented out as these properties don't exist)
  // if (subscription.price_override) {
  //   monthlyFee = subscription.price_override;
  // }

  // Apply discount (commented out as these properties don't exist)
  // if (subscription.discount_percentage > 0) {
  //   monthlyFee = monthlyFee * (1 - subscription.discount_percentage / 100);
  // }

  return monthlyFee;
};

export const calculateTotalSpent = (subscription: DeviceSubscription, invoices: any[]): number => {
  const serviceInvoices = invoices?.filter(inv => 
    inv.invoice_data && 
    JSON.stringify(inv.invoice_data).includes(subscription.id)
  ) || [];
  
  return serviceInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0);
};

export const calculateNextBillingDate = (subscription: DeviceSubscription): string => {
  const startDate = new Date(subscription.start_date);
  const nextBillingDate = new Date(startDate);
  
  switch (subscription.billing_cycle) {
    case 'monthly':
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
      break;
    case 'annually':
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      break;
  }

  return nextBillingDate.toISOString().split('T')[0];
};

export const extractFeatures = (servicePlan: any): string[] => {
  return servicePlan?.features ? 
    Object.values(servicePlan.features).filter(f => typeof f === 'string') as string[] :
    ['Basic monitoring', 'Standard support'];
};

export const transformSubscriptionToActiveService = (
  subscription: DeviceSubscription,
  context: ServiceTransformationContext
): ActiveService => {
  const { vehicles, invoices } = context;
  const servicePlan = subscription.service_plan || null;
  const subscriptionVehicles = vehicles.filter(v => v.device_id === subscription.device_id);

  const serviceType = determineServiceType(servicePlan);
  const monthlyFee = calculateMonthlyFee(subscription, servicePlan);
  const totalSpent = calculateTotalSpent(subscription, invoices);
  const nextBillingDate = calculateNextBillingDate(subscription);
  const features = extractFeatures(servicePlan);

  return {
    id: subscription.id,
    name: servicePlan?.plan_name || 'Unknown Service',
    serviceName: servicePlan?.plan_name || 'Unknown Service',
    serviceType,
    type: serviceType,
    vehicle: subscriptionVehicles[0] ? {
      id: subscriptionVehicles[0].id,
      plateNumber: subscriptionVehicles[0].device_name || subscriptionVehicles[0].device_id,
      model: 'Unknown Model',
      activatedDate: subscription.start_date,
      status: subscription.subscription_status === 'active' ? 'active' : 'paused'
    } : undefined,
    vehicles: subscriptionVehicles.map(v => ({
      id: v.id,
      plateNumber: v.device_name || v.device_id,
      model: 'Unknown Model',
      activatedDate: subscription.start_date,
      status: subscription.subscription_status === 'active' ? 'active' : 'paused'
    })),
    status: mapSubscriptionToActiveServiceStatus(subscription.subscription_status as any),
    activatedDate: subscription.start_date,
    expiryDate: subscription.end_date,
    monthlyFee,
    cost: monthlyFee,
    totalSpent,
    nextRenewal: nextBillingDate,
    lastUsed: subscription.subscription_status === 'active' ? '2 hours ago' : '1 week ago',
    features,
    icon: getServiceIcon(serviceType),
    autoRenew: subscription.auto_renewal,
    nextBillingDate,
    deviceSubscription: subscription,
    servicePlan
  };
};
