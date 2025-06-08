
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { ActiveService } from '@/types/active-services';

interface ServiceFeaturesTabProps {
  selectedService: ActiveService;
}

const ServiceFeaturesTab: React.FC<ServiceFeaturesTabProps> = ({
  selectedService,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Features</CardTitle>
        <CardDescription>Features included with this service</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {selectedService.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceFeaturesTab;
