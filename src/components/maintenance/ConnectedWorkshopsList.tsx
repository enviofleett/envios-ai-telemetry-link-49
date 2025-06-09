
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Phone } from 'lucide-react';

interface Workshop {
  id: string;
  name: string;
  representativeName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  serviceTypes: string[];
  rating: number;
  reviewCount: number;
  activationFee: number;
  operatingHours: string;
  verified: boolean;
}

interface ConnectedWorkshopsListProps {
  workshops: Workshop[];
}

export const ConnectedWorkshopsList: React.FC<ConnectedWorkshopsListProps> = ({ workshops }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Workshops</CardTitle>
        <CardDescription>
          Workshops you're connected to for maintenance services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workshops.map((workshop) => (
            <div key={workshop.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{workshop.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {workshop.city}, {workshop.country} • Rating: {workshop.rating}★
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {workshop.phone}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
