
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, MapPin } from 'lucide-react';

interface MaintenanceItem {
  id: string;
  vehicleId: string;
  plateNumber: string;
  model: string;
  serviceType: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  workshop?: string;
  priority: 'low' | 'medium' | 'high';
}

interface MaintenanceListProps {
  maintenanceItems: MaintenanceItem[];
}

export const MaintenanceList: React.FC<MaintenanceListProps> = ({ maintenanceItems }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'in-progress':
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Maintenance</CardTitle>
        <CardDescription>
          Scheduled maintenance activities for your fleet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {maintenanceItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{item.plateNumber} - {item.serviceType}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.model} • Scheduled: {item.scheduledDate}
                  </div>
                  {item.workshop && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.workshop}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityBadge(item.priority)}
                {getStatusBadge(item.status)}
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
