
import { supabase } from '@/integrations/supabase/client';
import { 
  DeviceSubscription, 
  CreateSubscriptionRequest, 
  UpdateSubscriptionRequest 
} from '@/types/billing';

export const deviceSubscriptionsApi = {
  async getDeviceSubscriptions(): Promise<DeviceSubscription[]> {
    const { data, error } = await supabase
      .from('device_subscriptions')
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DeviceSubscription[];
  },

  async getDeviceSubscription(id: string): Promise<DeviceSubscription | null> {
    const { data, error } = await supabase
      .from('device_subscriptions')
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as DeviceSubscription | null;
  },

  async getDeviceSubscriptionByDeviceId(deviceId: string): Promise<DeviceSubscription | null> {
    const { data, error } = await supabase
      .from('device_subscriptions')
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .eq('device_id', deviceId)
      .eq('subscription_status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as DeviceSubscription | null;
  },

  async createDeviceSubscription(subscription: CreateSubscriptionRequest): Promise<DeviceSubscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('device_subscriptions')
      .insert({
        ...subscription,
        customer_id: user.id,
        auto_renewal: subscription.auto_renewal ?? true,
        discount_percentage: subscription.discount_percentage ?? 0
      })
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .single();

    if (error) throw error;
    return data as DeviceSubscription;
  },

  async updateDeviceSubscription(id: string, updates: UpdateSubscriptionRequest): Promise<DeviceSubscription> {
    const { data, error } = await supabase
      .from('device_subscriptions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        service_plan:service_plans(*)
      `)
      .single();

    if (error) throw error;
    return data as DeviceSubscription;
  },

  async cancelDeviceSubscription(id: string): Promise<DeviceSubscription> {
    return this.updateDeviceSubscription(id, { 
      subscription_status: 'cancelled',
      auto_renewal: false 
    });
  },

  async renewDeviceSubscription(id: string, newEndDate: string): Promise<DeviceSubscription> {
    return this.updateDeviceSubscription(id, { 
      end_date: newEndDate,
      subscription_status: 'active' 
    });
  }
};
