
import { supabase } from '@/integrations/supabase/client';
import type {
  SubscriberPackage,
  PackageFeature,
  MenuPermission,
  ReferralCode,
  UserSubscription,
  CreatePackageRequest,
  UpdatePackageRequest
} from '@/types/subscriber-packages';

export const subscriberPackageApi = {
  // Package management
  async getPackages(): Promise<SubscriberPackage[]> {
    const { data, error } = await supabase
      .from('subscriber_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPackage(id: string): Promise<SubscriberPackage | null> {
    const { data, error } = await supabase
      .from('subscriber_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createPackage(packageData: CreatePackageRequest): Promise<SubscriberPackage> {
    const { feature_ids, menu_permission_ids, ...packageFields } = packageData;

    // Create the package
    const { data: packageResult, error: packageError } = await supabase
      .from('subscriber_packages')
      .insert(packageFields)
      .select()
      .single();

    if (packageError) throw packageError;

    // Assign features
    if (feature_ids.length > 0) {
      const featureAssignments = feature_ids.map(feature_id => ({
        package_id: packageResult.id,
        feature_id
      }));

      const { error: featureError } = await supabase
        .from('package_feature_assignments')
        .insert(featureAssignments);

      if (featureError) throw featureError;
    }

    // Assign menu permissions
    if (menu_permission_ids.length > 0) {
      const menuAssignments = menu_permission_ids.map(menu_permission_id => ({
        package_id: packageResult.id,
        menu_permission_id
      }));

      const { error: menuError } = await supabase
        .from('package_menu_permissions')
        .insert(menuAssignments);

      if (menuError) throw menuError;
    }

    return packageResult;
  },

  async updatePackage(packageData: UpdatePackageRequest): Promise<SubscriberPackage> {
    const { id, feature_ids, menu_permission_ids, ...packageFields } = packageData;

    // Update package
    const { data: packageResult, error: packageError } = await supabase
      .from('subscriber_packages')
      .update({ ...packageFields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (packageError) throw packageError;

    // Update feature assignments if provided
    if (feature_ids) {
      // Remove existing assignments
      await supabase
        .from('package_feature_assignments')
        .delete()
        .eq('package_id', id);

      // Add new assignments
      if (feature_ids.length > 0) {
        const featureAssignments = feature_ids.map(feature_id => ({
          package_id: id,
          feature_id
        }));

        const { error: featureError } = await supabase
          .from('package_feature_assignments')
          .insert(featureAssignments);

        if (featureError) throw featureError;
      }
    }

    // Update menu permission assignments if provided
    if (menu_permission_ids) {
      // Remove existing assignments
      await supabase
        .from('package_menu_permissions')
        .delete()
        .eq('package_id', id);

      // Add new assignments
      if (menu_permission_ids.length > 0) {
        const menuAssignments = menu_permission_ids.map(menu_permission_id => ({
          package_id: id,
          menu_permission_id
        }));

        const { error: menuError } = await supabase
          .from('package_menu_permissions')
          .insert(menuAssignments);

        if (menuError) throw menuError;
      }
    }

    return packageResult;
  },

  async deletePackage(id: string): Promise<void> {
    const { error } = await supabase
      .from('subscriber_packages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Feature management
  async getFeatures(): Promise<PackageFeature[]> {
    const { data, error } = await supabase
      .from('package_features')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getPackageFeatures(packageId: string): Promise<PackageFeature[]> {
    const { data, error } = await supabase
      .from('package_feature_assignments')
      .select(`
        package_features (*)
      `)
      .eq('package_id', packageId);

    if (error) throw error;
    return data?.map(item => item.package_features).filter(Boolean) || [];
  },

  // Menu permissions
  async getMenuPermissions(): Promise<MenuPermission[]> {
    const { data, error } = await supabase
      .from('menu_permissions')
      .select('*')
      .eq('is_active', true)
      .order('menu_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getPackageMenuPermissions(packageId: string): Promise<MenuPermission[]> {
    const { data, error } = await supabase
      .from('package_menu_permissions')
      .select(`
        menu_permissions (*)
      `)
      .eq('package_id', packageId);

    if (error) throw error;
    return data?.map(item => item.menu_permissions).filter(Boolean) || [];
  },

  // Referral codes
  async getReferralCodes(): Promise<ReferralCode[]> {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createReferralCode(codeData: Partial<ReferralCode>): Promise<ReferralCode> {
    const { data, error } = await supabase
      .from('referral_codes')
      .insert(codeData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async validateReferralCode(code: string): Promise<ReferralCode | null> {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      // Check if code is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }
      
      // Check if usage limit is reached
      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        return null;
      }
    }

    return data;
  },

  // User subscriptions
  async getUserSubscriptions(userId?: string): Promise<UserSubscription[]> {
    let query = supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createUserSubscription(subscriptionData: Partial<UserSubscription>): Promise<UserSubscription> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
