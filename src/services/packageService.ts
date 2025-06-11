
import { supabase } from '@/integrations/supabase/client';
import { PackageMappingService } from './packageMappingService';
import type { 
  SubscriberPackage, 
  CreatePackageRequest, 
  UpdatePackageRequest,
  PackageFeature,
  MenuPermission
} from '@/types/subscriber-packages';

export class PackageService {
  /**
   * Creates a new subscriber package with features and permissions
   */
  static async createPackage(request: CreatePackageRequest): Promise<{
    success: boolean;
    packageId?: string;
    error?: string;
  }> {
    try {
      // Validate package data
      const validation = await PackageMappingService.validatePackage(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Create the package
      const { data: packageData, error: packageError } = await supabase
        .from('subscriber_packages')
        .insert({
          package_name: request.package_name,
          description: request.description,
          user_type: request.user_type,
          subscription_fee_monthly: request.subscription_fee_monthly,
          subscription_fee_annually: request.subscription_fee_annually,
          referral_discount_percentage: request.referral_discount_percentage || 0,
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (packageError) {
        return {
          success: false,
          error: packageError.message
        };
      }

      // Assign features to package
      if (request.feature_ids && request.feature_ids.length > 0) {
        const featureAssignments = request.feature_ids.map(featureId => ({
          package_id: packageData.id,
          feature_id: featureId
        }));

        const { error: featureError } = await supabase
          .from('package_feature_assignments')
          .insert(featureAssignments);

        if (featureError) {
          console.error('Error assigning features:', featureError);
        }
      }

      // Assign menu permissions to package
      if (request.menu_permission_ids && request.menu_permission_ids.length > 0) {
        const menuAssignments = request.menu_permission_ids.map(menuId => ({
          package_id: packageData.id,
          menu_permission_id: menuId
        }));

        const { error: menuError } = await supabase
          .from('package_menu_permissions')
          .insert(menuAssignments);

        if (menuError) {
          console.error('Error assigning menu permissions:', menuError);
        }
      }

      return {
        success: true,
        packageId: packageData.id
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Gets all packages with their associated features and permissions
   */
  static async getAllPackages(): Promise<{
    success: boolean;
    packages?: SubscriberPackage[];
    error?: string;
  }> {
    try {
      const { data: packages, error } = await supabase
        .from('subscriber_packages')
        .select(`
          *,
          package_feature_assignments (
            package_features (
              id,
              feature_name,
              description,
              category
            )
          ),
          package_menu_permissions (
            menu_permissions (
              id,
              menu_code,
              menu_name,
              description
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        packages: packages || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Gets all available features
   */
  static async getAllFeatures(): Promise<{
    success: boolean;
    features?: PackageFeature[];
    error?: string;
  }> {
    try {
      const { data: features, error } = await supabase
        .from('package_features')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        features: features || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Gets all menu permissions
   */
  static async getAllMenuPermissions(): Promise<{
    success: boolean;
    permissions?: MenuPermission[];
    error?: string;
  }> {
    try {
      const { data: permissions, error } = await supabase
        .from('menu_permissions')
        .select('*')
        .eq('is_active', true)
        .order('menu_name', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        permissions: permissions || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Updates an existing package
   */
  static async updatePackage(request: UpdatePackageRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { id, feature_ids, menu_permission_ids, ...updateData } = request;

      // Update package basic information
      const { error: packageError } = await supabase
        .from('subscriber_packages')
        .update(updateData)
        .eq('id', id);

      if (packageError) {
        return {
          success: false,
          error: packageError.message
        };
      }

      // Update feature assignments if provided
      if (feature_ids !== undefined) {
        // Remove existing assignments
        await supabase
          .from('package_feature_assignments')
          .delete()
          .eq('package_id', id);

        // Add new assignments
        if (feature_ids.length > 0) {
          const featureAssignments = feature_ids.map(featureId => ({
            package_id: id,
            feature_id: featureId
          }));

          await supabase
            .from('package_feature_assignments')
            .insert(featureAssignments);
        }
      }

      // Update menu permission assignments if provided
      if (menu_permission_ids !== undefined) {
        // Remove existing assignments
        await supabase
          .from('package_menu_permissions')
          .delete()
          .eq('package_id', id);

        // Add new assignments
        if (menu_permission_ids.length > 0) {
          const menuAssignments = menu_permission_ids.map(menuId => ({
            package_id: id,
            menu_permission_id: menuId
          }));

          await supabase
            .from('package_menu_permissions')
            .insert(menuAssignments);
        }
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Deletes a package (soft delete by setting is_active to false)
   */
  static async deletePackage(packageId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if package has active subscriptions
      const { data: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('package_id', packageId)
        .eq('subscription_status', 'active');

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        return {
          success: false,
          error: 'Cannot delete package with active subscriptions'
        };
      }

      // Soft delete the package
      const { error } = await supabase
        .from('subscriber_packages')
        .update({ is_active: false })
        .eq('id', packageId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
