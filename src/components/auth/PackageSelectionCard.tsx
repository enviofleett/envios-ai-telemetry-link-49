
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface PackageInfo {
  packageId: string;
  packageName: string;
  description: string;
  features?: string[];
  price?: string;
  recommended?: boolean;
}

interface PackageSelectionCardProps {
  package: PackageInfo;
  isSelected: boolean;
  onSelect: (packageId: string) => void;
}

const PackageSelectionCard: React.FC<PackageSelectionCardProps> = ({
  package: pkg,
  isSelected,
  onSelect
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
          : 'hover:border-gray-300'
      }`}
      onClick={() => onSelect(pkg.packageId)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{pkg.packageName}</CardTitle>
          {pkg.recommended && (
            <Badge variant="secondary">Recommended</Badge>
          )}
        </div>
        <CardDescription>{pkg.description}</CardDescription>
        {pkg.price && (
          <div className="text-xl font-bold text-blue-600">{pkg.price}</div>
        )}
      </CardHeader>
      <CardContent>
        {pkg.features && (
          <ul className="space-y-2">
            {pkg.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default PackageSelectionCard;
