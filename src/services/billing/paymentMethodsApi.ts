
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod } from '@/types/billing';

export const paymentMethodsApi = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as PaymentMethod[];
  },

  async addPaymentMethod(paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const insertData = {
      customer_id: user.id,
      is_active: true,
      method_type: paymentMethod.method_type || 'card',
      stripe_payment_method_id: paymentMethod.stripe_payment_method_id,
      is_default: paymentMethod.is_default || false,
      card_last_four: paymentMethod.card_last_four,
      card_brand: paymentMethod.card_brand,
      card_exp_month: paymentMethod.card_exp_month,
      card_exp_year: paymentMethod.card_exp_year,
      billing_address: paymentMethod.billing_address || {}
    };

    const { data, error } = await supabase
      .from('payment_methods')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as PaymentMethod;
  },

  async setDefaultPaymentMethod(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First, unset all default payment methods for the user
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('customer_id', user.id);

    // Then set the selected one as default
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', id)
      .eq('customer_id', user.id);

    if (error) throw error;
  }
};
