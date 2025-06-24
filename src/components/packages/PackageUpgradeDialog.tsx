
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { usePackageManagement } from '@/hooks/usePackageManagement';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import type { SubscriberPackage } from '@/types/subscriber-packages';

interface PackageUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFeature?: string;
}

const PackageUpgradeDialog: React.FC<PackageUpgradeDialogProps> = ({
  open,
  onOpenChange,
  currentFeature
}) => {
  const { user } = useUnifiedAuth();
  const { packages, getUserPackage, assignPackage, isAssigning } = usePackageManagement();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Get user's current package
  const { data: userPackage } = user?.id ? getUserPackage(user.id) : { data: null };

  const handleUpgrade = () => {
    if (!user?.id || !selectedPackage) return;
    
    assignPackage({ userId: user.id, packageId: selectedPackage });
    onOpenChange(false);
  };

  const getPackageFeatures = (packageName: string) => {
    switch (packageName) {
      case 'Basic Plan':
        return ['GPS Tracking', 'Basic Reports', 'Email Alerts'];
      case 'Professional Plan':
        return ['GPS Tracking', 'Advanced Reports', 'Geofencing', 'Driver Management', 'Fleet Analytics', 'Custom Alerts'];
      case 'Enterprise Plan':
        return ['All Professional Features', 'API Access', 'Custom Integrations', 'Priority Support', 'Advanced Analytics', 'Multi-user Management', 'White-label Options', 'Custom Development'];
      default:
        return [];
    }
  };

  const isCurrentPackage = (pkg: SubscriberPackage) => {
    return userPackage?.id === pkg.id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Your Package</DialogTitle>
          <DialogDescription>
            {currentFeature 
              ? `Unlock ${currentFeature} and more with a higher tier package`
              : 'Choose a package that fits your needs'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {Array.isArray(packages) && packages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`cursor-pointer border-2 transition-colors ${
                selectedPackage === pkg.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : isCurrentPackage(pkg)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => !isCurrentPackage(pkg) && setSelectedPackage(pkg.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pkg.package_name}</CardTitle>
                  {isCurrentPackage(pkg) && (
                    <Badge variant="default">Current</Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-primary">
                  ₦{pkg.subscription_fee_monthly?.toLocaleString() || 0}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Features included:</h4>
                  {getPackageFeatures(pkg.package_name).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {pkg.vehicle_limit && (
                  <div className="mt-4 p-2 bg-gray-100 rounded">
                    <span className="text-sm font-medium">
                      Vehicle Limit: {pkg.vehicle_limit} vehicles
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpgrade}
            disabled={!selectedPackage || isAssigning}
          >
            {isAssigning ? 'Upgrading...' : 'Upgrade Package'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageUpgradeDialog;
