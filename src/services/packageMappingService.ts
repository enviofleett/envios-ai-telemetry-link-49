
import type { SubscriberPackage } from '@/types/subscriber-packages';
import type { GP51UserType } from '@/types/gp51-user';

export interface PackageToGP51Mapping {
  packageId: string;
  packageName: string;
  gp51UserType: 1 | 2 | 3 | 4; // GP51 user types
  envioRole: 'user' | 'admin';
  requiresApproval: boolean;
  description: string;
}

export class PackageMappingService {
  /**
   * Core package-to-GP51 user type mapping
   */
  static getPackageMapping(): Record<string, PackageToGP51Mapping> {
    return {
      'basic': {
        packageId: 'basic',
        packageName: 'Basic Fleet User',
        gp51UserType: 3, // END_USER
        envioRole: 'user',
        requiresApproval: false,
        description: 'Standard fleet tracking access with basic features'
      },
      'professional': {
        packageId: 'professional',
        packageName: 'Professional Fleet Manager',
        gp51UserType: 2, // SUB_ADMIN
        envioRole: 'user',
        requiresApproval: false,
        description: 'Advanced fleet management with reporting and analytics'
      },
      'enterprise': {
        packageId: 'enterprise',
        packageName: 'Enterprise Fleet Administrator',
        gp51UserType: 2, // SUB_ADMIN
        envioRole: 'admin',
        requiresApproval: true,
        description: 'Full administrative access with all features and user management'
      }
    };
  }

  /**
   * Get GP51 user type for a package
   */
  static getGP51UserType(packageId: string): number {
    const mapping = this.getPackageMapping();
    return mapping[packageId]?.gp51UserType || 3; // Default to END_USER
  }

  /**
   * Get Envio role for a package
   */
  static getEnvioRole(packageId: string): 'user' | 'admin' {
    const mapping = this.getPackageMapping();
    return mapping[packageId]?.envioRole || 'user';
  }

  /**
   * Check if package requires admin approval
   */
  static requiresApproval(packageId: string): boolean {
    const mapping = this.getPackageMapping();
    return mapping[packageId]?.requiresApproval || false;
  }

  /**
   * Validate package selection
   */
  static validatePackage(packageId: string): { isValid: boolean; error?: string } {
    const mapping = this.getPackageMapping();
    
    if (!packageId) {
      return { isValid: false, error: 'Package selection is required' };
    }
    
    if (!mapping[packageId]) {
      return { isValid: false, error: 'Invalid package selected' };
    }
    
    return { isValid: true };
  }

  /**
   * Get package display information
   */
  static getPackageInfo(packageId: string): PackageToGP51Mapping | null {
    const mapping = this.getPackageMapping();
    return mapping[packageId] || null;
  }

  /**
   * Get all available packages for selection
   */
  static getAvailablePackages(): PackageToGP51Mapping[] {
    const mapping = this.getPackageMapping();
    return Object.values(mapping);
  }
}
