
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import EnhancedGeocodingConfiguration from '@/components/admin/EnhancedGeocodingConfiguration';

const MapsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Advanced Geocoding Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Configure advanced geocoding services with database persistence, monitoring, and detailed analytics.
            This includes Google Maps integration, usage tracking, and performance metrics.
          </p>
        </CardContent>
      </Card>
      
      <EnhancedGeocodingConfiguration />
    </div>
  );
};

export default MapsTab;
