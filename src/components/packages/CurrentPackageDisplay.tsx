
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowUp, Settings } from 'lucide-react';
import { useUserPackage } from '@/hooks/useUserPackage';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import PackageUpgradeDialog from './PackageUpgradeDialog';

const CurrentPackageDisplay: React.FC = () => {
  const { user } = useUnifiedAuth();
  const { data: userPackage, isLoading } = useUserPackage(user?.id);
  const { features, isLoading: featuresLoading } = useFeatureAccess(userPackage?.id);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  if (isLoading || featuresLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userPackage) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Package className="h-5 w-5" />
            No Package Assigned
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700 mb-4">
            You don't have a package assigned. Please contact support or select a package.
          </p>
          <Button onClick={() => setShowUpgradeDialog(true)}>
            Select Package
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Package className="h-5 w-5" />
              Current Package
            </CardTitle>
            <Badge variant="default" className="bg-green-600">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              {userPackage.package_name}
            </h3>
            <p className="text-green-700">{userPackage.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-green-900">
                ₦{userPackage.subscription_fee_monthly?.toLocaleString() || 0}
              </span>
              <span className="text-green-700">/month</span>
            </div>
            {userPackage.vehicle_limit && (
              <Badge variant="outline" className="border-green-300 text-green-700">
                {userPackage.vehicle_limit} vehicles max
              </Badge>
            )}
          </div>

          <div>
            <h4 className="font-medium text-green-900 mb-2">Active Features:</h4>
            <div className="flex flex-wrap gap-2">
              {features.slice(0, 6).map((featureId) => (
                <Badge key={featureId} variant="secondary" className="text-xs">
                  {featureId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
              {features.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{features.length - 6} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => setShowUpgradeDialog(true)}
              className="flex-1"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Upgrade Package
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <PackageUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
      />
    </>
  );
};

export default CurrentPackageDisplay;
