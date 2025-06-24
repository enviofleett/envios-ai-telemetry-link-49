
import { SubscriptionStatus, ActiveServiceStatus } from '@/types/service-transformations';

export const mapSubscriptionToActiveServiceStatus = (status: string): ActiveServiceStatus => {
  switch (status) {
    case 'active': return 'active';
    case 'suspended': return 'paused';
    case 'paused': return 'paused';
    case 'cancelled': return 'expired';
    case 'expired': return 'expired';
    default: return 'pending';
  }
};

export const mapActiveServiceToSubscriptionStatus = (status: ActiveServiceStatus): SubscriptionStatus => {
  switch (status) {
    case 'active': return 'active';
    case 'paused': return 'paused';
    case 'expired': return 'expired';
    case 'pending': return 'suspended';
    default: return 'active';
  }
};
