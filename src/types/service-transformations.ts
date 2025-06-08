
import { ActiveService } from '@/types/active-services';
import { DeviceSubscription } from '@/types/billing';

export interface ServiceTransformationContext {
  subscriptions: DeviceSubscription[];
  vehicles: any[];
  invoices: any[];
  servicePlans: any[];
}

export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'expired';
export type ActiveServiceStatus = ActiveService['status'];
