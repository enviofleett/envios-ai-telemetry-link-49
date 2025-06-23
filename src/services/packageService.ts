
import { supabase } from '@/integrations/supabase/client';
import type { SubscriberPackage } from '@/types/subscriber-packages';

export interface PackageAssignmentResult {
  success: boolean;
  package?: SubscriberPackage;
  error?: string;
}

export const packageService = {
  // Get all active packages
  async getActivePackages(): Promise<SubscriberPackage[]> {
    const { data, error } = await supabase
      .from('subscriber_packages')
      .select('*')
      .eq('is_active', true)
      .order('subscription_fee_monthly', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get package by ID
  async getPackageById(packageId: string): Promise<SubscriberPackage | null> {
    const { data, error } = await supabase
      .from('subscriber_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get user's current package
  async getUserPackage(userId: string): Promise<SubscriberPackage | null> {
    try {
      // First get the user's active subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('package_id')
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .single();

      if (subError && subError.code !== 'PGRST116') throw subError;
      if (!subscription) return null;

      // Then get the package details
      const { data: packageData, error: pkgError } = await supabase
        .from('subscriber_packages')
        .select('*')
        .eq('id', subscription.package_id)
        .single();

      if (pkgError && pkgError.code !== 'PGRST116') throw pkgError;
      return packageData;
    } catch (error) {
      console.error('Error getting user package:', error);
      return null;
    }
  },

  // Get default package (Basic Plan)
  async getDefaultPackage(): Promise<SubscriberPackage | null> {
    const { data, error } = await supabase
      .from('subscriber_packages')
      .select('*')
      .eq('package_name', 'Basic Plan')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Assign package to user
  async assignPackageToUser(userId: string, packageId: string): Promise<PackageAssignmentResult> {
    try {
      // Check if package exists
      const packageData = await this.getPackageById(packageId);
      if (!packageData) {
        return { success: false, error: 'Package not found' };
      }

      // Create or update user subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          package_id: packageId,
          subscription_status: 'active',
          billing_cycle: 'monthly',
          start_date: new Date().toISOString(),
          discount_applied: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      return { success: true, package: packageData };
    } catch (error) {
      console.error('Error assigning package:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to assign package' 
      };
    }
  },

  // Auto-assign default package to new users
  async autoAssignDefaultPackage(userId: string): Promise<PackageAssignmentResult> {
    try {
      const defaultPackage = await this.getDefaultPackage();
      if (!defaultPackage) {
        return { success: false, error: 'No default package found' };
      }

      return await this.assignPackageToUser(userId, defaultPackage.id);
    } catch (error) {
      console.error('Error auto-assigning default package:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to auto-assign package' 
      };
    }
  }
};
