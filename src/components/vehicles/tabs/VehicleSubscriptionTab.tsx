
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Package, CreditCard } from 'lucide-react';
import { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleSubscriptionTabProps {
  vehicle: Vehicle;
}

// Mock subscription data - in real app this would come from your backend
const mockSubscription = {
  packageName: "Fleet Pro",
  type: "Premium" as const,
  startDate: "2024-01-01",
  expiryDate: "2024-12-31",
  status: "active" as const,
  features: [
    "Real-time tracking",
    "Advanced analytics", 
    "Maintenance alerts",
    "Driver behavior monitoring"
  ],
  monthlyFee: 49.99,
  autoRenew: true,
};

export const VehicleSubscriptionTab: React.FC<VehicleSubscriptionTabProps> = ({ vehicle }) => {
  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "expiring_soon":
        return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Subscription Package
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{mockSubscription.packageName}</h3>
            <p className="text-muted-foreground">{mockSubscription.type} Plan</p>
          </div>
          {getSubscriptionStatusBadge(mockSubscription.status)}
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span>{mockSubscription.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expiry Date:</span>
              <span className="font-medium">{mockSubscription.expiryDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Fee:</span>
              <span>${mockSubscription.monthlyFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto Renew:</span>
              <span className="flex items-center gap-1">
                {mockSubscription.autoRenew ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {mockSubscription.autoRenew ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Included Features:</h4>
            <ul className="space-y-1">
              {mockSubscription.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
          <Button>
            <Package className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
