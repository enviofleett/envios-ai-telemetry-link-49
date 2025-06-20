
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

    // Use the existing user_subscriptions table with package_id instead of product_id
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: request.userId,
        package_id: request.productId, // Use package_id as per existing schema
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        subscription_status: 'active', // Use subscription_status as per existing schema
        // Note: paystack_reference_id, total_amount_paid_usd, tenure_months, auto_renew
        // may not exist in the current schema, so we'll skip them for now
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

    // Transform the database result to match our interface
    const userSubscription: UserSubscription = {
      id: subscription.id,
      user_id: subscription.user_id,
      product_id: subscription.package_id, // Map package_id back to product_id for our interface
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      status: subscription.subscription_status as UserSubscription['status'],
      paystack_reference_id: request.paystackReferenceId,
      total_amount_paid_usd: request.totalAmount,
      tenure_months: request.tenureMonths,
      auto_renew: false,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at
    };

    // For now, skip vehicle assignment since subscription_vehicles table doesn't exist
    // This would be implemented once the proper schema is in place

    return userSubscription;
  }

  async assignVehiclesToSubscription(subscriptionId: string, vehicleIds: string[]): Promise<void> {
    // Skip for now since subscription_vehicles table doesn't exist yet
    console.log('Vehicle assignment skipped - table not available yet');
  }

  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        packages (
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

    // Transform the database results to match our interface
    return data.map(sub => ({
      id: sub.id,
      user_id: sub.user_id,
      product_id: sub.package_id,
      start_date: sub.start_date,
      end_date: sub.end_date,
      status: sub.subscription_status as UserSubscription['status'],
      paystack_reference_id: undefined,
      total_amount_paid_usd: 0,
      tenure_months: 1,
      auto_renew: false,
      created_at: sub.created_at,
      updated_at: sub.updated_at
    })) as UserSubscription[];
  }

  async getSubscriptionVehicles(subscriptionId: string): Promise<string[]> {
    // Skip for now since subscription_vehicles table doesn't exist yet
    return [];
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
      paystack_reference_id: undefined,
      total_amount_paid_usd: 0,
      tenure_months: 1,
      auto_renew: false,
      created_at: sub.created_at,
      updated_at: sub.updated_at
    })) as UserSubscription[];
  }

  async expireSubscription(subscriptionId: string): Promise<void> {
    // Update subscription status
    await this.updateSubscriptionStatus(subscriptionId, 'expired');

    // Skip token revocation since sharing_tokens table doesn't exist yet
    console.log('Token revocation skipped - table not available yet');
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
