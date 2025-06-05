
import { servicePlansApi } from './servicePlansApi';
import { deviceSubscriptionsApi } from './deviceSubscriptionsApi';
import { invoicesApi } from './invoicesApi';
import { paymentMethodsApi } from './paymentMethodsApi';
import { dashboardStatsApi } from './dashboardStatsApi';

export const billingApi = {
  // Service Plans
  ...servicePlansApi,
  
  // Device Subscriptions
  ...deviceSubscriptionsApi,
  
  // Invoices
  ...invoicesApi,
  
  // Payment Methods
  ...paymentMethodsApi,
  
  // Dashboard Stats
  ...dashboardStatsApi
};
