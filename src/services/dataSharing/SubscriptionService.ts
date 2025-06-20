
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

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: request.userId,
        product_id: request.productId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        paystack_reference_id: request.paystackReferenceId,
        total_amount_paid_usd: request.totalAmount,
        tenure_months: request.tenureMonths,
        auto_renew: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    // Assign vehicles to subscription
    if (request.vehicleIds.length > 0) {
      await this.assignVehiclesToSubscription(subscription.id, request.vehicleIds);
    }

    return subscription as UserSubscription;
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

    return (data || []) as UserSubscription[];
  }

  async getSubscriptionVehicles(subscriptionId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('subscription_vehicles')
      .select('vehicle_id')
      .eq('subscription_id', subscriptionId);

    if (error) {
      console.error('Failed to fetch subscription vehicles:', error);
      throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }

    return (data || []).map(item => item.vehicle_id);
  }

  async updateSubscriptionStatus(subscriptionId: string, status: UserSubscription['status']): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ status, updated_at: new Date().toISOString() })
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
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString());

    if (error) {
      console.error('Failed to fetch active subscriptions:', error);
      return [];
    }

    return (data || []) as UserSubscription[];
  }

  async expireSubscription(subscriptionId: string): Promise<void> {
    // Update subscription status
    await this.updateSubscriptionStatus(subscriptionId, 'expired');

    // Revoke all associated tokens
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
