
import { supabase } from '@/integrations/supabase/client';
import type { 
  SubscriberPackage, 
  PackageFeature, 
  MenuPermission, 
  ReferralCode,
  UserSubscription,
  CreatePackageRequest,
  UpdatePackageRequest,
  PackageToGP51Mapping
} from '@/types/subscriber-packages';

export interface PackageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PackageAssignmentResult {
  success: boolean;
  subscriptionId?: string;
  gp51UserType?: number;
  assignedRoles?: string[];
  error?: string;
}

export class PackageMappingService {
  /**
   * Validates package data for creation/update
   */
  static async validatePackage(packageData: Partial<CreatePackageRequest>): Promise<PackageValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!packageData.package_name?.trim()) {
      errors.push('Package name is required');
    }

    if (!packageData.user_type) {
      errors.push('User type is required');
    }

    // Pricing validation
    if (packageData.subscription_fee_monthly !== undefined && packageData.subscription_fee_monthly < 0) {
      errors.push('Monthly fee cannot be negative');
    }

    if (packageData.subscription_fee_annually !== undefined && packageData.subscription_fee_annually < 0) {
      errors.push('Annual fee cannot be negative');
    }

    // Referral discount validation
    if (packageData.referral_discount_percentage !== undefined) {
      if (packageData.referral_discount_percentage < 0 || packageData.referral_discount_percentage > 100) {
        errors.push('Referral discount must be between 0 and 100');
      }
    }

    // Check for duplicate package name
    if (packageData.package_name) {
      const { data: existingPackage } = await supabase
        .from('subscriber_packages')
        .select('id')
        .eq('package_name', packageData.package_name)
        .single();

      if (existingPackage) {
        errors.push('Package name already exists');
      }
    }

    // Feature validation
    if (packageData.feature_ids && packageData.feature_ids.length === 0) {
      warnings.push('Package has no features assigned');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Maps package to GP51 user type based on package features and permissions
   */
  static mapPackageToGP51UserType(packageData: SubscriberPackage): number {
    // Map package user types to GP51 user types
    const userTypeMapping: { [key: string]: number } = {
      'end_user': 1,     // Standard GP51 user
      'sub_admin': 2,    // GP51 sub-administrator
      'both': 2          // Default to sub_admin for mixed packages
    };

    return userTypeMapping[packageData.user_type] || 1;
  }

  /**
   * Maps package to system roles
   */
  static mapPackageToRoles(packageData: SubscriberPackage): string[] {
    const roles: string[] = ['user']; // Default role

    if (packageData.user_type === 'sub_admin' || packageData.user_type === 'both') {
      roles.push('admin');
    }

    return roles;
  }

  /**
   * Gets package information for display
   */
  static getPackageInfo(packageId: string): PackageToGP51Mapping | null {
    const packageMap: { [key: string]: PackageToGP51Mapping } = {
      'basic': {
        packageId: 'basic',
        packageName: 'Basic Package',
        description: 'Essential vehicle tracking features',
        requiresApproval: false,
        gp51UserType: 1,
        features: ['Real-time tracking', 'Basic reports']
      },
      'professional': {
        packageId: 'professional',
        packageName: 'Professional Package',
        description: 'Advanced fleet management tools',
        requiresApproval: false,
        gp51UserType: 1,
        features: ['Advanced analytics', 'Fleet management', 'Custom reports']
      },
      'enterprise': {
        packageId: 'enterprise',
        packageName: 'Enterprise Package',
        description: 'Full administrative access',
        requiresApproval: true,
        gp51UserType: 2,
        features: ['Full admin access', 'User management', 'API access']
      }
    };

    return packageMap[packageId] || null;
  }

  /**
   * Gets available packages for selection
   */
  static getAvailablePackages(): PackageToGP51Mapping[] {
    return [
      {
        packageId: 'basic',
        packageName: 'Basic Package',
        description: 'Essential vehicle tracking features',
        requiresApproval: false,
        gp51UserType: 1,
        features: ['Real-time tracking', 'Basic reports']
      },
      {
        packageId: 'professional',
        packageName: 'Professional Package',
        description: 'Advanced fleet management tools',
        requiresApproval: false,
        gp51UserType: 1,
        features: ['Advanced analytics', 'Fleet management', 'Custom reports']
      },
      {
        packageId: 'enterprise',
        packageName: 'Enterprise Package',
        description: 'Full administrative access',
        requiresApproval: true,
        gp51UserType: 2,
        features: ['Full admin access', 'User management', 'API access']
      }
    ];
  }

  /**
   * Assigns package to user and creates subscription
   */
  static async assignPackageToUser(
    userId: string,
    packageId: string,
    billingCycle: 'monthly' | 'annually',
    referralCode?: string
  ): Promise<PackageAssignmentResult> {
    try {
      // Get package details
      const { data: packageData, error: packageError } = await supabase
        .from('subscriber_packages')
        .select('*')
        .eq('id', packageId)
        .eq('is_active', true)
        .single();

      if (packageError || !packageData) {
        return {
          success: false,
          error: 'Package not found or inactive'
        };
      }

      // Validate referral code if provided
      let discountApplied = 0;
      if (referralCode) {
        const { data: referral } = await supabase
          .from('referral_codes')
          .select('*')
          .eq('code', referralCode)
          .eq('is_active', true)
          .single();

        if (referral && (referral.usage_limit === null || referral.usage_count < referral.usage_limit)) {
          if (!referral.expires_at || new Date(referral.expires_at) > new Date()) {
            discountApplied = referral.discount_percentage;
          }
        }
      }

      // Create subscription
      const subscriptionData = {
        user_id: userId,
        package_id: packageId,
        subscription_status: 'active' as const,
        billing_cycle: billingCycle,
        start_date: new Date().toISOString(),
        end_date: this.calculateEndDate(billingCycle),
        referral_code_used: referralCode || null,
        discount_applied: discountApplied
      };

      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subscriptionError) {
        return {
          success: false,
          error: `Failed to create subscription: ${subscriptionError.message}`
        };
      }

      // Update referral code usage if used
      if (referralCode && discountApplied > 0) {
        await supabase
          .from('referral_codes')
          .update({ usage_count: supabase.rpc('increment_usage', { code: referralCode }) })
          .eq('code', referralCode);
      }

      // Map to GP51 user type and roles - cast the data properly
      const typedPackageData = packageData as unknown as SubscriberPackage;
      const gp51UserType = this.mapPackageToGP51UserType(typedPackageData);
      const assignedRoles = this.mapPackageToRoles(typedPackageData);

      // Assign roles to user
      for (const role of assignedRoles) {
        const roleType = role === 'admin' ? 'admin' : 'user';
        await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: roleType
          }, {
            onConflict: 'user_id,role'
          });
      }

      return {
        success: true,
        subscriptionId: subscription.id,
        gp51UserType,
        assignedRoles
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Gets all available packages with their features and permissions
   */
  static async getAvailablePackagesFromDB(): Promise<{
    success: boolean;
    packages?: SubscriberPackage[];
    error?: string;
  }> {
    try {
      const { data: packages, error } = await supabase
        .from('subscriber_packages')
        .select(`
          *,
          package_feature_assignments!inner (
            package_features (
              feature_name,
              description,
              category
            )
          ),
          package_menu_permissions!inner (
            menu_permissions (
              menu_code,
              menu_name,
              description
            )
          )
        `)
        .eq('is_active', true)
        .order('subscription_fee_monthly', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        packages: packages as unknown as SubscriberPackage[] || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Gets user's current subscription and package details
   */
  static async getUserSubscription(userId: string): Promise<{
    success: boolean;
    subscription?: UserSubscription & { package: SubscriberPackage };
    error?: string;
  }> {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscriber_packages (*)
        `)
        .eq('user_id', userId)
        .eq('subscription_status', 'active')
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Transform the data to match expected structure
      const transformedSubscription = {
        ...subscription,
        package: subscription.subscriber_packages
      } as UserSubscription & { package: SubscriberPackage };

      return {
        success: true,
        subscription: transformedSubscription
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Calculates subscription end date based on billing cycle
   */
  private static calculateEndDate(billingCycle: 'monthly' | 'annually'): string {
    const now = new Date();
    if (billingCycle === 'monthly') {
      now.setMonth(now.getMonth() + 1);
    } else {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now.toISOString();
  }

  /**
   * Validates referral code
   */
  static async validateReferralCode(code: string): Promise<{
    isValid: boolean;
    discount?: number;
    error?: string;
  }> {
    try {
      const { data: referral, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !referral) {
        return {
          isValid: false,
          error: 'Invalid referral code'
        };
      }

      // Check usage limit
      if (referral.usage_limit !== null && referral.usage_count >= referral.usage_limit) {
        return {
          isValid: false,
          error: 'Referral code usage limit exceeded'
        };
      }

      // Check expiration
      if (referral.expires_at && new Date(referral.expires_at) <= new Date()) {
        return {
          isValid: false,
          error: 'Referral code has expired'
        };
      }

      return {
        isValid: true,
        discount: referral.discount_percentage
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Updates package assignment for user
   */
  static async updateUserPackage(
    userId: string,
    newPackageId: string,
    billingCycle: 'monthly' | 'annually'
  ): Promise<PackageAssignmentResult> {
    try {
      // Deactivate current subscription
      await supabase
        .from('user_subscriptions')
        .update({
          subscription_status: 'cancelled',
          end_date: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('subscription_status', 'active');

      // Create new subscription
      return await this.assignPackageToUser(userId, newPackageId, billingCycle);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
