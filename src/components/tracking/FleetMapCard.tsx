
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
            <p className="text-sm text-muted-foreground">Real-time vehicle locations from GP51</p>
          </div>

          {/* Dynamic vehicle markers based on real data */}
          {vehicles.slice(0, 5).map((vehicle, index) => {
            const positions = [
              { top: '25%', left: '25%', color: 'bg-green-500' },
              { top: '33%', left: '50%', color: 'bg-green-500' },
              { top: '66%', left: '33%', color: 'bg-blue-500' },
              { top: '50%', right: '25%', color: 'bg-red-500' },
              { bottom: '25%', right: '33%', color: 'bg-yellow-500' }
            ];
            
            const position = positions[index] || positions[0];
            
            return (
              <div
                key={vehicle.deviceid}
                className={`absolute ${position.color} text-white p-1 rounded-full h-6 w-6 flex items-center justify-center text-xs cursor-pointer`}
                style={{ 
                  top: position.top, 
                  left: position.left, 
                  right: position.right, 
                  bottom: position.bottom 
                }}
                onClick={() => onVehicleSelect(vehicle)}
                title={`${vehicle.devicename} - ${vehicle.status}`}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetMapCard;
