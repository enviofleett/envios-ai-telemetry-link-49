
import { supabase } from '@/integrations/supabase/client';

export interface SubscriberPackage {
  id: string;
  package_name: string;
  description: string;
  subscription_fee_monthly: number;
  subscription_fee_annually: number;
  vehicle_limit: number;
  chatbot_prompt_limit: number;
  referral_discount_percentage: number;
  user_type: 'both' | 'end_user' | 'sub_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

class PackageService {
  async getPackages(): Promise<SubscriberPackage[]> {
    try {
      const { data, error } = await supabase
        .from('subscriber_packages')
        .select('*')
        .eq('is_active', true)
        .order('subscription_fee_monthly', { ascending: true });

      if (error) throw error;

      return (data || []).map(pkg => ({
        ...pkg,
        user_type: this.normalizeUserType(pkg.user_type)
      })) as SubscriberPackage[];
    } catch (error) {
      console.error('Error fetching packages:', error);
      return [];
    }
  }

  async getActivePackages(): Promise<SubscriberPackage[]> {
    return this.getPackages();
  }

  async getPackageById(packageId: string): Promise<SubscriberPackage | null> {
    try {
      const { data, error } = await supabase
        .from('subscriber_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        user_type: this.normalizeUserType(data.user_type)
      } as SubscriberPackage;
    } catch (error) {
      console.error('Error fetching package by ID:', error);
      return null;
    }
  }

  async getUserPackage(userId: string): Promise<SubscriberPackage | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscriber_packages (*)
        `)
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .single();

      if (error || !data || !data.subscriber_packages) return null;

      return {
        ...data.subscriber_packages,
        user_type: this.normalizeUserType(data.subscriber_packages.user_type)
      } as SubscriberPackage;
    } catch (error) {
      console.error('Error fetching user package:', error);
      return null;
    }
  }

  async createPackage(packageData: Omit<SubscriberPackage, 'id' | 'created_at' | 'updated_at'>): Promise<SubscriberPackage | null> {
    try {
      const { data, error } = await supabase
        .from('subscriber_packages')
        .insert([packageData])
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        user_type: this.normalizeUserType(data.user_type)
      } as SubscriberPackage;
    } catch (error) {
      console.error('Error creating package:', error);
      return null;
    }
  }

  async updatePackage(packageId: string, updates: Partial<SubscriberPackage>): Promise<SubscriberPackage | null> {
    try {
      const { data, error } = await supabase
        .from('subscriber_packages')
        .update(updates)
        .eq('id', packageId)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        user_type: this.normalizeUserType(data.user_type)
      } as SubscriberPackage;
    } catch (error) {
      console.error('Error updating package:', error);
      return null;
    }
  }

  async deletePackage(packageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriber_packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting package:', error);
      return false;
    }
  }

  async assignPackageToUser(userId: string, packageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, deactivate any existing subscriptions
      await supabase
        .from('user_subscriptions')
        .update({ subscription_status: 'cancelled' })
        .eq('user_id', userId);

      // Create new subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: userId,
          package_id: packageId,
          subscription_status: 'active',
          start_date: new Date().toISOString(),
          billing_cycle: 'monthly'
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error assigning package to user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async autoAssignDefaultPackage(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the default package (lowest price)
      const packages = await this.getPackages();
      if (packages.length === 0) {
        return { success: false, error: 'No packages available' };
      }

      const defaultPackage = packages[0]; // Already sorted by price
      return this.assignPackageToUser(userId, defaultPackage.id);
    } catch (error) {
      console.error('Error auto-assigning default package:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private normalizeUserType(userType: string): 'both' | 'end_user' | 'sub_admin' {
    switch (userType.toLowerCase()) {
      case 'both':
        return 'both';
      case 'end_user':
      case 'enduser':
        return 'end_user';
      case 'sub_admin':
      case 'subadmin':
        return 'sub_admin';
      default:
        return 'both'; // Default fallback
    }
  }
}

export const packageService = new PackageService();
