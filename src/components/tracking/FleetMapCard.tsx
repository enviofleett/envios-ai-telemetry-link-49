
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface FleetMapCardProps {
  vehicles: any[];
  onVehicleSelect: (vehicle: any) => void;
}

const FleetMapCard: React.FC<FleetMapCardProps> = ({ vehicles, onVehicleSelect }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-Time Fleet Map - GP51</CardTitle>
        <CardDescription>Track all active vehicles in real-time using GP51 data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg relative">
          <div className="text-center">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Interactive Fleet Map</p>
            <p className="text-sm text-muted-foreground">Map integration coming soon</p>
            <p className="text-xs text-muted-foreground mt-2">
              {vehicles.length} vehicles ready for tracking
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetMapCard;
