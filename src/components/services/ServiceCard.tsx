
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Pause, Play, Settings } from 'lucide-react';
import { ActiveService } from '@/types/active-services';

interface ServiceCardProps {
  service: ActiveService;
  onStatusUpdate: (serviceId: string, status: 'active' | 'paused') => void;
  onManage: (service: ActiveService) => void;
  getStatusBadge: (status: string) => React.ReactElement;
  getServiceTypeIcon: (type: string) => React.ReactElement;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onStatusUpdate,
  onManage,
  getStatusBadge,
  getServiceTypeIcon,
}) => {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <service.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{service.serviceName}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                {getServiceTypeIcon(service.serviceType)}
                <span className="capitalize">{service.serviceType}</span>
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(service.status)}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Vehicles:</span>
            <span className="font-medium">{service.vehicles.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Fee:</span>
            <span className="font-medium">
              {service.monthlyFee > 0 ? `$${service.monthlyFee.toFixed(2)}` : 'One-time'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Used:</span>
            <span className="font-medium">{service.lastUsed}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expires:</span>
            <span className="font-medium">{service.expiryDate}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features:</h4>
          <div className="space-y-1">
            {service.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <div className="p-6 pt-0">
        <div className="flex gap-2">
          {service.status === 'active' ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onStatusUpdate(service.id, 'paused')}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onStatusUpdate(service.id, 'active')}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManage(service)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ServiceCard;
