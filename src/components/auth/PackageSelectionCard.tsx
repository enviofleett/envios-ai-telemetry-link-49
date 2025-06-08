
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, Users, Zap } from 'lucide-react';
import type { PackageToGP51Mapping } from '@/services/packageMappingService';

interface PackageSelectionCardProps {
  package: PackageToGP51Mapping;
  isSelected: boolean;
  onSelect: (packageId: string) => void;
}

const PackageSelectionCard: React.FC<PackageSelectionCardProps> = ({
  package: packageInfo,
  isSelected,
  onSelect
}) => {
  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'basic':
        return <Users className="h-5 w-5" />;
      case 'professional':
        return <Zap className="h-5 w-5" />;
      case 'enterprise':
        return <Shield className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getPackageFeatures = (packageId: string) => {
    switch (packageId) {
      case 'basic':
        return [
          'Real-time vehicle tracking',
          'Basic reporting',
          'Mobile app access',
          'Email support'
        ];
      case 'professional':
        return [
          'Advanced analytics',
          'Fleet management tools',
          'Custom reports',
          'Priority support',
          'Geofencing',
          'Driver behavior monitoring'
        ];
      case 'enterprise':
        return [
          'Full administrative access',
          'User management',
          'Advanced security features',
          'API access',
          'Custom integrations',
          'Dedicated support',
          'SLA guarantee'
        ];
      default:
        return [];
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:bg-gray-50'
      }`}
      onClick={() => onSelect(packageInfo.packageId)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPackageIcon(packageInfo.packageId)}
            <CardTitle className="text-lg">{packageInfo.packageName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {packageInfo.requiresApproval && (
              <Badge variant="outline" className="text-orange-600">
                Requires Approval
              </Badge>
            )}
            {isSelected && (
              <div className="rounded-full bg-blue-500 p-1">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">{packageInfo.description}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {getPackageFeatures(packageInfo.packageId).map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PackageSelectionCard;
