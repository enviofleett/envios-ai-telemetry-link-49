
export interface PackageToGP51Mapping {
  packageId: string;
  packageName: string;
  description: string;
  gp51UserType: number;
  envioRole: string;
  requiresApproval: boolean;
}

export interface PackageValidationResult {
  isValid: boolean;
  error?: string;
}

export class PackageMappingService {
  private static packages: PackageToGP51Mapping[] = [
    {
      packageId: 'basic',
      packageName: 'Basic',
      description: 'Essential vehicle tracking features',
      gp51UserType: 1,
      envioRole: 'user',
      requiresApproval: false
    },
    {
      packageId: 'professional',
      packageName: 'Professional',
      description: 'Advanced fleet management tools',
      gp51UserType: 2,
      envioRole: 'user',
      requiresApproval: false
    },
    {
      packageId: 'enterprise',
      packageName: 'Enterprise',
      description: 'Full administrative access and features',
      gp51UserType: 3,
      envioRole: 'admin',
      requiresApproval: true
    }
  ];

  static getAvailablePackages(): PackageToGP51Mapping[] {
    return this.packages;
  }

  static getPackageInfo(packageId: string): PackageToGP51Mapping | null {
    return this.packages.find(pkg => pkg.packageId === packageId) || null;
  }

  static validatePackage(packageId: string): PackageValidationResult {
    const packageInfo = this.getPackageInfo(packageId);
    
    if (!packageInfo) {
      return {
        isValid: false,
        error: 'Invalid package selected'
      };
    }

    return {
      isValid: true
    };
  }

  static getGP51UserType(packageId: string): number {
    const packageInfo = this.getPackageInfo(packageId);
    return packageInfo?.gp51UserType || 1;
  }

  static getEnvioRole(packageId: string): string {
    const packageInfo = this.getPackageInfo(packageId);
    return packageInfo?.envioRole || 'user';
  }

  static requiresApproval(packageId: string): boolean {
    const packageInfo = this.getPackageInfo(packageId);
    return packageInfo?.requiresApproval || false;
  }
}
