import { supabase } from '@/integrations/supabase/client';
import type { 
  CreateSubscriptionRequest, 
  UserSubscription, 
  DataSharingProduct,
  SubscriptionVehicle 
} from '@/types/data-sharing';

export class SubscriptionService {
  async createSubscription(request: CreateSubscriptionRequest): Promise<UserSubscription> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + request.tenureMonths);

    // Use product_id as package_id since they're the same concept in this context
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: request.userId,
        package_id: request.productId, // Map product_id to package_id
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        subscription_status: 'active',
        tenure_months: request.tenureMonths,
        auto_renew: false,
        paystack_reference_id: request.paystackReferenceId,
        total_amount_paid_usd: request.totalAmount
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    if (!subscription) {
      throw new Error('Failed to create subscription: No data returned');
    }

    // Assign vehicles to subscription
    if (request.vehicleIds.length > 0) {
      await this.assignVehiclesToSubscription(subscription.id, request.vehicleIds);
    }

    return {
      id: subscription.id,
      user_id: subscription.user_id,
      product_id: subscription.package_id, // Map back for consistency
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      status: subscription.subscription_status as UserSubscription['status'],
      paystack_reference_id: subscription.paystack_reference_id,
      total_amount_paid_usd: subscription.total_amount_paid_usd || 0,
      tenure_months: subscription.tenure_months || request.tenureMonths,
      auto_renew: subscription.auto_renew || false,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at
    };
  }

  async assignVehiclesToSubscription(subscriptionId: string, vehicleIds: string[]): Promise<void> {
    const assignments = vehicleIds.map(vehicleId => ({
      subscription_id: subscriptionId,
      vehicle_id: vehicleId
    }));

    const { error } = await supabase
      .from('subscription_vehicles')
      .insert(assignments);

    if (error) {
      console.error('Failed to assign vehicles to subscription:', error);
      throw new Error(`Failed to assign vehicles: ${error.message}`);
    }
  }

  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        data_sharing_products (
          name,
          description,
          features
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch user subscriptions:', error);
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    if (!data) return [];

    return data.map(sub => ({
      id: sub.id,
      user_id: sub.user_id,
      product_id: sub.package_id,
      start_date: sub.start_date,
      end_date: sub.end_date,
      status: sub.subscription_status as UserSubscription['status'],
      paystack_reference_id: sub.paystack_reference_id,
      total_amount_paid_usd: sub.total_amount_paid_usd || 0,
      tenure_months: sub.tenure_months || 1,
      auto_renew: sub.auto_renew || false,
      created_at: sub.created_at,
      updated_at: sub.updated_at
    })) as UserSubscription[];
  }

  async getSubscriptionVehicles(subscriptionId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('subscription_vehicles')
      .select('vehicle_id')
      .eq('subscription_id', subscriptionId);

    if (error) {
      console.error('Failed to fetch subscription vehicles:', error);
      return [];
    }

    return (data || []).map(item => item.vehicle_id);
  }

  async updateSubscriptionStatus(subscriptionId: string, status: UserSubscription['status']): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        subscription_status: status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Failed to update subscription status:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  async getActiveSubscriptions(): Promise<UserSubscription[]> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('subscription_status', 'active')
      .lt('end_date', new Date().toISOString());

    if (error) {
      console.error('Failed to fetch active subscriptions:', error);
      return [];
    }

    if (!data) return [];

    return data.map(sub => ({
      id: sub.id,
      user_id: sub.user_id,
      product_id: sub.package_id,
      start_date: sub.start_date,
      end_date: sub.end_date,
      status: sub.subscription_status as UserSubscription['status'],
      paystack_reference_id: sub.paystack_reference_id,
      total_amount_paid_usd: sub.total_amount_paid_usd || 0,
      tenure_months: sub.tenure_months || 1,
      auto_renew: sub.auto_renew || false,
      created_at: sub.created_at,
      updated_at: sub.updated_at
    })) as UserSubscription[];
  }

  async expireSubscription(subscriptionId: string): Promise<void> {
    // Update subscription status
    await this.updateSubscriptionStatus(subscriptionId, 'expired');

    // Revoke all tokens for this subscription
    const { error } = await supabase
      .from('sharing_tokens')
      .update({ 
        is_active: false,
        revoked_at: new Date().toISOString()
      })
      .eq('subscription_id', subscriptionId);

    if (error) {
      console.error('Failed to revoke tokens for expired subscription:', error);
    }
  }

  // Method to check and expire subscriptions (should be called periodically)
  async checkAndExpireSubscriptions(): Promise<void> {
    const expiredSubscriptions = await this.getActiveSubscriptions();
    
    for (const subscription of expiredSubscriptions) {
      await this.expireSubscription(subscription.id);
    }
  }
}

export const subscriptionService = new SubscriptionService();
