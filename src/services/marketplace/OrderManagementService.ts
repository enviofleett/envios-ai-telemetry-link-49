
import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  merchant_id: string;
}

export interface CreateOrderRequest {
  buyer_id: string;
  items: OrderItem[];
  shipping_address?: any;
  payment_method?: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  currency: string;
  payment_reference?: string;
  paystack_reference?: string;
  escrow_status?: string;
  payment_status?: string;
  payment_method?: string;
  shipping_address?: any;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

class OrderManagementService {
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const totalAmount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .insert({
        buyer_id: orderData.buyer_id,
        total_amount: totalAmount,
        currency: 'NGN',
        status: 'pending',
        payment_status: 'pending',
        escrow_status: 'pending',
        payment_method: orderData.payment_method,
        shipping_address: orderData.shipping_address
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      merchant_id: item.merchant_id,
      quantity: item.quantity,
      price: item.price,
      vehicle_ids: [] // Will be populated based on product configuration
    }));

    const { error: itemsError } = await supabase
      .from('marketplace_order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order as Order;
  }

  async updateOrderStatus(orderId: string, status: Order['status'], additionalData?: any): Promise<void> {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    const { error } = await supabase
      .from('marketplace_orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

    // Log the status change
    await this.logOrderActivity(orderId, 'status_change', {
      old_status: 'unknown',
      new_status: status,
      ...additionalData
    });
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_order_items (
          id,
          product_id,
          merchant_id,
          quantity,
          price,
          vehicle_ids
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_order_items (
          id,
          product_id,
          merchant_id,
          quantity,
          price,
          vehicle_ids
        )
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Order[];
  }

  private async logOrderActivity(orderId: string, activityType: string, activityData: any): Promise<void> {
    const { error } = await supabase
      .from('marketplace_order_activities')
      .insert({
        order_id: orderId,
        activity_type: activityType,
        activity_data: activityData,
        created_at: new Date().toISOString()
      });

    if (error) console.error('Failed to log order activity:', error);
  }
}

export const orderManagementService = new OrderManagementService();
