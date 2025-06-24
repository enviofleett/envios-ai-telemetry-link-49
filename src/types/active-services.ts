
import { DeviceSubscription, ServicePlan } from '@/types/billing';
import { Car, Shield, Package, Settings } from 'lucide-react';

export interface ActiveService {
  id: string;
  name: string; // Legacy property for compatibility
  serviceName: string;
  type: string; // Legacy property for compatibility
  serviceType: 'telemetry' | 'insurance' | 'parts' | 'platform';
  vehicles: {
    id: string;
    plateNumber: string;
    model: string;
    activatedDate: string;
    status: 'active' | 'paused';
  }[];
  status: 'active' | 'paused' | 'expired' | 'pending';
  vehicle: string; // Legacy property for compatibility
  nextRenewal: string; // Legacy property for compatibility
  cost: number; // Legacy property for compatibility
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

export interface ServiceStats {
  totalMonthlySpend: number;
  totalSpent: number;
  allVehicles: Array<{ id: string; plateNumber: string; model: string }>;
  activeCount: number;
  pausedCount: number;
}

// Icon mapping for service types
export const getServiceIcon = (serviceType: string) => {
  switch (serviceType) {
    case 'telemetry': return Car;
    case 'insurance': return Shield;
    case 'parts': return Package;
    case 'platform': return Settings;
    default: return Settings;
  }
};
