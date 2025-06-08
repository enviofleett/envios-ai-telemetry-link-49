
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard } from 'lucide-react';
import { ActiveService } from '@/types/active-services';

interface ServiceBillingTabProps {
  selectedService: ActiveService;
}

const ServiceBillingTab: React.FC<ServiceBillingTabProps> = ({
  selectedService,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Monthly Fee</Label>
            <div className="text-2xl font-bold">${selectedService.monthlyFee.toFixed(2)}</div>
          </div>
          <div className="space-y-2">
            <Label>Next Billing Date</Label>
            <div className="text-lg">{selectedService.nextBillingDate}</div>
          </div>
          <div className="space-y-2">
            <Label>Total Spent</Label>
            <div className="text-lg">${selectedService.totalSpent.toFixed(2)}</div>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>**** 1234</span>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Update Payment Method
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceBillingTab;
