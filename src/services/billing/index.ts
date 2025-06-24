
import { servicePlansApi } from './servicePlansApi';
import { deviceSubscriptionsApi } from './deviceSubscriptionsApi';
import { invoicesApi } from './invoicesApi';
import { paymentMethodsApi } from './paymentMethodsApi';
// Fix: Import the correct export name
import { fetchDashboardStats, fetchRevenueGrowth } from './dashboardStatsApi';

export const billingApi = {
  // Service Plans
  ...servicePlansApi,
  
  // Device Subscriptions
  ...deviceSubscriptionsApi,
  
  // Invoices
  ...invoicesApi,
  
  // Payment Methods
  ...paymentMethodsApi,
  
  // Dashboard Stats - Fix: Use the correct function names
  fetchDashboardStats,
  fetchRevenueGrowth
};
