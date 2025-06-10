
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
  workshops?: Workshop[];
}

const ConnectedWorkshopsList: React.FC<ConnectedWorkshopsListProps> = ({ workshops = [] }) => {
  // Mock data for demonstration if no workshops provided
  const mockWorkshops: Workshop[] = [
    {
      id: '1',
      name: 'AutoCare Pro',
      representativeName: 'John Smith',
      email: 'john@autocarepro.com',
      phone: '+1-555-0123',
      city: 'New York',
      country: 'USA',
      serviceTypes: ['Oil Change', 'Brake Service', 'Engine Diagnostics'],
      rating: 4.8,
      reviewCount: 156,
      activationFee: 50,
      operatingHours: '8AM - 6PM',
      verified: true
    },
    {
      id: '2',
      name: 'Quick Fix Garage',
      representativeName: 'Sarah Johnson',
      email: 'sarah@quickfix.com',
      phone: '+1-555-0456',
      city: 'Los Angeles',
      country: 'USA',
      serviceTypes: ['Tire Service', 'Battery Replacement', 'Inspection'],
      rating: 4.5,
      reviewCount: 89,
      activationFee: 35,
      operatingHours: '7AM - 7PM',
      verified: true
    }
  ];

  const displayWorkshops = workshops.length > 0 ? workshops : mockWorkshops;

  if (displayWorkshops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Workshops</CardTitle>
          <CardDescription>
            Workshops you're connected to for maintenance services
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Connected Workshops</h3>
          <p className="text-muted-foreground mb-4">
            Connect with workshops to schedule maintenance services
          </p>
          <Button>Find Workshops</Button>
        </CardContent>
      </Card>
    );
  }

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
          {displayWorkshops.map((workshop) => (
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

export default ConnectedWorkshopsList;
