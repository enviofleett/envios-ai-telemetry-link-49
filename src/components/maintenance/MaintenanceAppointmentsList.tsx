
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Plus, AlertCircle } from 'lucide-react';
import { useMaintenanceAppointments } from '@/hooks/maintenance/useMaintenanceAppointments';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { MaintenanceAppointment } from '@/types/maintenance';

const MaintenanceAppointmentsList: React.FC = () => {
  const { getUserAppointments, updateAppointmentStatus, loading } = useMaintenanceAppointments();
  const [appointments, setAppointments] = useState<MaintenanceAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getUserAppointments();
        setAppointments(data);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [getUserAppointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'inspection': return 'bg-green-100 text-green-800';
      case 'repair': return 'bg-red-100 text-red-800';
      case 'diagnostic': return 'bg-yellow-100 text-yellow-800';
      case 'consultation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: MaintenanceAppointment['appointment_status']) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      // Refresh appointments
      const updatedAppointments = await getUserAppointments();
      setAppointments(updatedAppointments);
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Appointments</CardTitle>
          <CardDescription>Loading appointments...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Maintenance Appointments</CardTitle>
            <CardDescription>
              Manage your upcoming and past maintenance appointments
            </CardDescription>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Schedule Appointment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No appointments scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Schedule your first maintenance appointment to get started
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getTypeColor(appointment.appointment_type)}>
                        {appointment.appointment_type}
                      </Badge>
                      <Badge className={getStatusColor(appointment.appointment_status)}>
                        {appointment.appointment_status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold mb-1">
                      {appointment.service_description || `${appointment.appointment_type} Service`}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(appointment.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(appointment.scheduled_date).toLocaleTimeString()} 
                          ({appointment.duration_minutes} mins)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>Vehicle ID: {appointment.vehicle_id}</span>
                      </div>
                    </div>
                    
                    {appointment.estimated_cost && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Estimated Cost: </span>
                        <span className="text-green-600">${appointment.estimated_cost}</span>
                      </div>
                    )}
                    
                    {appointment.notes && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Notes: </span>
                        {appointment.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {appointment.appointment_status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        disabled={loading}
                      >
                        Confirm
                      </Button>
                    )}
                    
                    {appointment.appointment_status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(appointment.id, 'in_progress')}
                        disabled={loading}
                      >
                        Start
                      </Button>
                    )}
                    
                    {['scheduled', 'confirmed'].includes(appointment.appointment_status) && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceAppointmentsList;
