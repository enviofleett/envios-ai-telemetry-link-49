
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import useMaintenance from '@/hooks/useMaintenance';
import type { MaintenanceAppointment } from '@/types/maintenance';
import { useToast } from '@/hooks/use-toast';

const MaintenanceAppointmentsList: React.FC = () => {
  const { getUserAppointments, updateAppointmentStatus } = useMaintenance();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<MaintenanceAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    const data = await getUserAppointments();
    setAppointments(data);
    setLoading(false);
  };

  const handleStatusUpdate = async (appointmentId: string, status: MaintenanceAppointment['appointment_status']) => {
    setUpdating(appointmentId);
    const success = await updateAppointmentStatus(appointmentId, status);
    
    if (success) {
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, appointment_status: status }
            : apt
        )
      );
      toast({
        title: "Status Updated",
        description: `Appointment status updated to ${status}`
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive"
      });
    }
    setUpdating(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      no_show: { color: 'bg-red-100 text-red-800', label: 'No Show' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={config?.color || 'bg-gray-100 text-gray-800'}>
        {config?.label || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Appointments</CardTitle>
          <CardDescription>
            Your scheduled maintenance appointments will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Appointments</h3>
          <p className="text-muted-foreground mb-4">
            You haven't scheduled any maintenance appointments yet
          </p>
          <Button>Schedule Appointment</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Appointments</CardTitle>
        <CardDescription>
          Manage your scheduled maintenance appointments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold capitalize">
                    {appointment.appointment_type} Service
                  </h3>
                  {getStatusBadge(appointment.appointment_status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(appointment.scheduled_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{appointment.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>Vehicle: {appointment.vehicle_id}</span>
                  </div>
                  {appointment.estimated_cost && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Estimated Cost: ${appointment.estimated_cost}</span>
                    </div>
                  )}
                </div>

                {appointment.service_description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {appointment.service_description}
                  </p>
                )}

                {appointment.notes && (
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    <strong>Notes:</strong> {appointment.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                {appointment.appointment_status === 'scheduled' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                      disabled={updating === appointment.id}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                      disabled={updating === appointment.id}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {appointment.appointment_status === 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                    disabled={updating === appointment.id}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default MaintenanceAppointmentsList;
