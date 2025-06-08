
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Wrench, CreditCard, MapPin, AlertTriangle, Car } from 'lucide-react';
import { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleMaintenanceTabProps {
  vehicle: Vehicle;
}

// Mock maintenance data
const mockNextAppointment = {
  id: "apt-1",
  type: "Engine Service",
  scheduledDate: "2024-03-15",
  workshop: "AutoCare Plus",
  workshopAddress: "456 Service Rd, City, State",
  estimatedDuration: "3 hours",
  cost: 450,
  status: "scheduled" as const,
  notes: "Engine warning light detected",
};

const mockMaintenanceHistory = [
  {
    id: "hist-1",
    type: "Oil Change",
    scheduledDate: "2024-01-15",
    workshop: "QuickLube",
    workshopAddress: "789 Oil St, City, State",
    estimatedDuration: "1 hour",
    cost: 75,
    status: "completed" as const,
  },
  {
    id: "hist-2",
    type: "Tire Rotation",
    scheduledDate: "2023-12-10",
    workshop: "Tire World",
    workshopAddress: "321 Tire Ave, City, State",
    estimatedDuration: "45 minutes",
    cost: 50,
    status: "completed" as const,
  },
];

export const VehicleMaintenanceTab: React.FC<VehicleMaintenanceTabProps> = ({ vehicle }) => {
  const [showWorkshopMarketplace, setShowWorkshopMarketplace] = useState(false);

  const getAppointmentStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Maintenance Management</h3>
        <Button onClick={() => setShowWorkshopMarketplace(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Workshop
        </Button>
      </div>

      {/* Next Appointment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Next Workshop Appointment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{mockNextAppointment.type}</h3>
            {getAppointmentStatusBadge(mockNextAppointment.status)}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="text-muted-foreground">Date: </span>
                {mockNextAppointment.scheduledDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="text-muted-foreground">Duration: </span>
                {mockNextAppointment.estimatedDuration}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="text-muted-foreground">Workshop: </span>
                {mockNextAppointment.workshop}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="text-muted-foreground">Cost: </span>${mockNextAppointment.cost}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-sm">
              <span className="text-muted-foreground">Address: </span>
              {mockNextAppointment.workshopAddress}
            </span>
          </div>

          {mockNextAppointment.notes && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <span className="text-sm">
                <span className="text-muted-foreground">Notes: </span>
                {mockNextAppointment.notes}
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm">
              Reschedule
            </Button>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Maintenance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockMaintenanceHistory.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{appointment.type}</h4>
                  {getAppointmentStatusBadge(appointment.status)}
                </div>
                <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
                  <span>Date: {appointment.scheduledDate}</span>
                  <span>Cost: ${appointment.cost}</span>
                  <span>Workshop: {appointment.workshop}</span>
                  <span>Duration: {appointment.estimatedDuration}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
