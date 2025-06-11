
// Stub implementation for package mapping service
export interface PackageToGP51Mapping {
  packageId: string;
  packageName: string;
  description: string;
  requiresApproval: boolean;
}

export class PackageMappingService {
  async getAllPackages(): Promise<PackageToGP51Mapping[]> {
    return [
      {
        packageId: 'basic',
        packageName: 'Basic Package',
        description: 'Basic fleet tracking features',
        requiresApproval: false
      },
      {
        packageId: 'professional',
        packageName: 'Professional Package', 
        description: 'Advanced fleet management tools',
        requiresApproval: false
      },
      {
        packageId: 'enterprise',
        packageName: 'Enterprise Package',
        description: 'Full enterprise features with admin access',
        requiresApproval: true
      }
    ];
  }

  async getPackageById(packageId: string): Promise<PackageToGP51Mapping | null> {
    const packages = await this.getAllPackages();
    return packages.find(p => p.packageId === packageId) || null;
  }
}

export const packageMappingService = new PackageMappingService();
