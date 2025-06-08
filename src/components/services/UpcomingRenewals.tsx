
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';
import { ActiveService } from '@/types/active-services';

interface UpcomingRenewalsProps {
  activeServices: ActiveService[];
  onRenewService: (serviceId: string, newEndDate: string) => void;
}

const UpcomingRenewals: React.FC<UpcomingRenewalsProps> = ({
  activeServices,
  onRenewService,
}) => {
  const upcomingRenewals = activeServices.filter((service) => {
    const expiryDate = new Date(service.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Renewals
        </CardTitle>
        <CardDescription>Services that will renew or expire soon</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingRenewals.map((service) => {
            const expiryDate = new Date(service.expiryDate);
            const now = new Date();
            const daysUntilExpiry = Math.ceil(
              (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div key={service.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{service.serviceName}</p>
                  <p className="text-sm text-muted-foreground">
                    Expires in {daysUntilExpiry} days ({service.expiryDate})
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newEndDate = new Date(service.expiryDate);
                    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                    onRenewService(service.id, newEndDate.toISOString());
                  }}
                >
                  Renew Now
                </Button>
              </div>
            );
          })}
          {upcomingRenewals.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No services expiring in the next 30 days
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingRenewals;
