
import { DeviceSubscription, ServicePlan } from '@/types/billing';

export interface ActiveService {
  id: string;
  serviceName: string;
  serviceType: 'telemetry' | 'insurance' | 'parts' | 'platform';
  vehicles: {
    id: string;
    plateNumber: string;
    model: string;
    activatedDate: string;
    status: 'active' | 'paused';
  }[];
  status: 'active' | 'paused' | 'expired' | 'pending';
  activatedDate: string;
  expiryDate: string;
  monthlyFee: number;
  totalSpent: number;
  lastUsed: string;
  features: string[];
  icon: any;
  autoRenew: boolean;
  nextBillingDate: string;
  usageData?: {
    month: string;
    amount: number;
  }[];
  // Link to original billing data
  deviceSubscription?: DeviceSubscription;
  servicePlan?: ServicePlan;
}

export interface ServiceUpdateRequest {
  autoRenew?: boolean;
  status?: 'active' | 'paused' | 'expired' | 'pending';
  notifications?: boolean;
}
