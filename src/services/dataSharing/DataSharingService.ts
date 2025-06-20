
import { supabase } from '@/integrations/supabase/client';
import type { DataSharingProduct, VehicleTelemetryData } from '@/types/data-sharing';

export class DataSharingService {
  async getAvailableProducts(): Promise<DataSharingProduct[]> {
    // Use marketplace_products since data_sharing_products doesn't exist yet
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('is_active', true)
      .order('price_usd', { ascending: true });

    if (error) {
      console.error('Failed to fetch marketplace products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    // Transform marketplace products to data sharing format
    return (data || []).map(product => ({
      id: product.id,
      category: product.category || 'data-sharing',
      name: product.name,
      description: product.description,
      base_cost_usd_per_month: product.price_usd || 0,
      cost_per_vehicle_usd_per_month: 5, // Default cost per vehicle
      data_points_included: ['location', 'speed', 'mileage'],
      features: product.features || {},
      max_vehicles_allowed: null,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at
    })) as DataSharingProduct[];
  }

  async getProduct(productId: string): Promise<DataSharingProduct | null> {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Failed to fetch product:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    if (!data) return null;

    // Transform to data sharing format
    return {
      id: data.id,
      category: data.category || 'data-sharing',
      name: data.name,
      description: data.description,
      base_cost_usd_per_month: data.price_usd || 0,
      cost_per_vehicle_usd_per_month: 5,
      data_points_included: ['location', 'speed', 'mileage'],
      features: data.features || {},
      max_vehicles_allowed: null,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as DataSharingProduct;
  }

  async getVehicleTelemetryData(vehicleIds: string[], dataPoints: string[]): Promise<VehicleTelemetryData[]> {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        last_position,
        total_mileage,
        updated_at,
        voltage,
        fuel_level
      `)
      .in('id', vehicleIds);

    if (error) {
      console.error('Failed to fetch vehicle telemetry:', error);
      throw new Error(`Failed to fetch telemetry: ${error.message}`);
    }

    if (!vehicles) return [];

    return vehicles.map(vehicle => {
      const telemetry: VehicleTelemetryData = {
        vehicle_id: vehicle.id,
        last_updated: vehicle.updated_at || new Date().toISOString()
      };

      // Add requested data points
      if (dataPoints.includes('location') && vehicle.last_position) {
        try {
          const position = typeof vehicle.last_position === 'string' 
            ? JSON.parse(vehicle.last_position) 
            : vehicle.last_position;
          
          if (position && position.latitude && position.longitude) {
            telemetry.location = {
              latitude: position.latitude,
              longitude: position.longitude,
              timestamp: position.timestamp || vehicle.updated_at
            };
          }
        } catch (e) {
          console.warn('Failed to parse position data for vehicle:', vehicle.id);
        }
      }

      if (dataPoints.includes('speed') && vehicle.last_position) {
        try {
          const position = typeof vehicle.last_position === 'string' 
            ? JSON.parse(vehicle.last_position) 
            : vehicle.last_position;
          telemetry.speed = position?.speed || 0;
        } catch (e) {
          telemetry.speed = 0;
        }
      }

      if (dataPoints.includes('mileage')) {
        telemetry.mileage = {
          daily: this.calculateDailyMileage(vehicle.id),
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

    if (!data) return null;

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

    // For now, always return true since api_usage_logs table doesn't exist yet
    // This would be implemented once the proper schema is in place
    return true;
  }
}

export const dataSharingService = new DataSharingService();
