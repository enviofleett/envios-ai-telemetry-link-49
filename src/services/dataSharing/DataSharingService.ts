
import { supabase } from '@/integrations/supabase/client';
import type { DataSharingProduct, VehicleTelemetryData } from '@/types/data-sharing';

export class DataSharingService {
  async getAvailableProducts(): Promise<DataSharingProduct[]> {
    const { data, error } = await supabase
      .from('data_sharing_products')
      .select('*')
      .eq('is_active', true)
      .order('base_cost_usd_per_month', { ascending: true });

    if (error) {
      console.error('Failed to fetch data sharing products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return (data || []) as DataSharingProduct[];
  }

  async getProduct(productId: string): Promise<DataSharingProduct | null> {
    const { data, error } = await supabase
      .from('data_sharing_products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Failed to fetch product:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data as DataSharingProduct;
  }

  async getVehicleTelemetryData(vehicleIds: string[], dataPoints: string[]): Promise<VehicleTelemetryData[]> {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        last_position,
        total_mileage,
        last_updated,
        voltage,
        fuel_level
      `)
      .in('id', vehicleIds);

    if (error) {
      console.error('Failed to fetch vehicle telemetry:', error);
      throw new Error(`Failed to fetch telemetry: ${error.message}`);
    }

    return (vehicles || []).map(vehicle => {
      const telemetry: VehicleTelemetryData = {
        vehicle_id: vehicle.id,
        last_updated: vehicle.last_updated || new Date().toISOString()
      };

      // Add requested data points
      if (dataPoints.includes('location') && vehicle.last_position) {
        const position = typeof vehicle.last_position === 'string' 
          ? JSON.parse(vehicle.last_position) 
          : vehicle.last_position;
        
        if (position.latitude && position.longitude) {
          telemetry.location = {
            latitude: position.latitude,
            longitude: position.longitude,
            timestamp: position.timestamp || vehicle.last_updated
          };
        }
      }

      if (dataPoints.includes('speed') && vehicle.last_position) {
        const position = typeof vehicle.last_position === 'string' 
          ? JSON.parse(vehicle.last_position) 
          : vehicle.last_position;
        telemetry.speed = position.speed || 0;
      }

      if (dataPoints.includes('mileage')) {
        telemetry.mileage = {
          daily: this.calculateDailyMileage(vehicle.id), // Would need implementation
          total: vehicle.total_mileage || 0
        };
      }

      if (dataPoints.includes('fuel_consumption')) {
        telemetry.fuel_consumption = vehicle.fuel_level || 0;
      }

      if (dataPoints.includes('voltage')) {
        telemetry.voltage = vehicle.voltage || 0;
      }

      return telemetry;
    });
  }

  async getUserProfile(userId: string): Promise<{ id: string; name: string; email: string; phone?: string } | null> {
    const { data, error } = await supabase
      .from('envio_users')
      .select('id, name, email, phone_number')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Failed to fetch user profile:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone_number
    };
  }

  async calculateSubscriptionCost(productId: string, vehicleCount: number, tenureMonths: number): Promise<number> {
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const monthlyCost = product.base_cost_usd_per_month + (product.cost_per_vehicle_usd_per_month * vehicleCount);
    return monthlyCost * tenureMonths;
  }

  private calculateDailyMileage(vehicleId: string): number {
    // This would need to be implemented based on your vehicle position history
    // For now, return 0 as placeholder
    return 0;
  }

  async checkRateLimit(tokenId: string, endpoint: string, rateLimitPerHour: number): Promise<boolean> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('id')
      .eq('token_id', tokenId)
      .eq('endpoint', endpoint)
      .gte('created_at', oneHourAgo.toISOString());

    if (error) {
      console.error('Failed to check rate limit:', error);
      return false; // Allow request if we can't check
    }

    const currentUsage = data?.length || 0;
    return currentUsage < rateLimitPerHour;
  }
}

export const dataSharingService = new DataSharingService();
