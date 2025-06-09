
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Users, DollarSign } from 'lucide-react';
import { subscriberPackageApi } from '@/services/subscriberPackageApi';
import { useToast } from '@/hooks/use-toast';
import type { SubscriberPackage } from '@/types/subscriber-packages';
import EditPackageDialog from './EditPackageDialog';

const PackageList: React.FC = () => {
  const [editingPackage, setEditingPackage] = useState<SubscriberPackage | null>(null);
  const { toast } = useToast();

  const { data: packages, isLoading, refetch } = useQuery({
    queryKey: ['subscriber-packages'],
    queryFn: subscriberPackageApi.getPackages
  });

  const handleDelete = async (packageId: string) => {
    try {
      await subscriberPackageApi.deletePackage(packageId);
      toast({
        title: "Package deleted",
        description: "The package has been successfully deleted."
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete package. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getUserTypeDisplay = (userType: string) => {
    switch (userType) {
      case 'end_user':
        return 'End User';
      case 'sub_admin':
        return 'Sub Admin';
      case 'both':
        return 'Both';
      default:
        return userType;
    }
  };

  const getUserTypeVariant = (userType: string) => {
    switch (userType) {
      case 'end_user':
        return 'default';
      case 'sub_admin':
        return 'secondary';
      case 'both':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages?.map((pkg) => (
          <Card key={pkg.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{pkg.package_name}</CardTitle>
                  <Badge variant={getUserTypeVariant(pkg.user_type)}>
                    <Users className="w-3 h-3 mr-1" />
                    {getUserTypeDisplay(pkg.user_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPackage(pkg)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pkg.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{pkg.description}</p>
              
              <div className="space-y-2">
                {pkg.subscription_fee_monthly && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      ₦{pkg.subscription_fee_monthly.toLocaleString()}/month
                    </span>
                  </div>
                )}
                {pkg.subscription_fee_annually && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      ₦{pkg.subscription_fee_annually.toLocaleString()}/year
                    </span>
                  </div>
                )}
              </div>

              {pkg.referral_discount_percentage > 0 && (
                <Badge variant="outline" className="w-fit">
                  {pkg.referral_discount_percentage}% referral discount
                </Badge>
              )}

              <div className="flex items-center justify-between pt-4">
                <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                  {pkg.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(pkg.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingPackage && (
        <EditPackageDialog
          package={editingPackage}
          open={true}
          onOpenChange={(open) => !open && setEditingPackage(null)}
          onSuccess={() => {
            setEditingPackage(null);
            refetch();
          }}
        />
      )}
    </>
  );
};

export default PackageList;
