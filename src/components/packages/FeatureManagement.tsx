
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subscriberPackageApi } from '@/services/subscriberPackageApi';
import type { PackageFeature } from '@/types/subscriber-packages';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import EditFeatureModal from './EditFeatureModal';

const FeatureManagement: React.FC = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<PackageFeature | null>(null);

  const { data: features, isLoading } = useQuery({
    queryKey: ['package-features'],
    queryFn: subscriberPackageApi.getFeatures
  });

  const handleEditClick = (feature: PackageFeature) => {
    setSelectedFeature(feature);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedFeature(null);
  };

  const groupedFeatures = features?.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, PackageFeature[]>);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Feature Management</h2>
          <Badge variant="outline">
            {features?.length || 0} Features Available
          </Badge>
        </div>

        {groupedFeatures && Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-semibold capitalize">{category} Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryFeatures.map((feature) => (
                <Card key={feature.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{feature.feature_name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {feature.feature_id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={feature.is_active ? 'default' : 'secondary'}>
                          {feature.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {feature.category}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(feature)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
      <EditFeatureModal
        feature={selectedFeature}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default FeatureManagement;
