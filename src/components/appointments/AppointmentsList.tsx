
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Filter } from 'lucide-react';
import { WorkshopAppointment } from '@/types/workshop';
import AppointmentCard from './AppointmentCard';
import { useAppointments } from '@/hooks/useAppointments';

interface AppointmentsListProps {
  onScheduleNew: () => void;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({ onScheduleNew }) => {
  const { appointments, cancelAppointment, isLoading } = useAppointments();
  const [selectedTab, setSelectedTab] = useState('all');

  const filterAppointments = (status?: WorkshopAppointment['appointment_status']) => {
    if (!appointments) return [];
    if (!status) return appointments;
    return appointments.filter(apt => apt.appointment_status === status);
  };

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      cancelAppointment({ id });
    }
  };

  const handleReschedule = (appointment: WorkshopAppointment) => {
    // This would open the scheduling modal with pre-filled data
    console.log('Reschedule appointment:', appointment);
  };

  const handleViewDetails = (appointment: WorkshopAppointment) => {
    // This would open a detailed view modal
    console.log('View appointment details:', appointment);
  };

  const getTabCounts = () => {
    if (!appointments) return {};
    return {
      all: appointments.length,
      scheduled: appointments.filter(a => a.appointment_status === 'scheduled').length,
      confirmed: appointments.filter(a => a.appointment_status === 'confirmed').length,
      completed: appointments.filter(a => a.appointment_status === 'completed').length,
      cancelled: appointments.filter(a => a.appointment_status === 'cancelled').length
    };
  };

  const tabCounts = getTabCounts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">Loading appointments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Appointments</h2>
          <p className="text-muted-foreground">
            Manage your vehicle service appointments
          </p>
        </div>
        <Button onClick={onScheduleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule New
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({tabCounts.all || 0})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({tabCounts.scheduled || 0})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({tabCounts.confirmed || 0})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({tabCounts.completed || 0})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({tabCounts.cancelled || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <AppointmentGrid 
            appointments={filterAppointments()} 
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <AppointmentGrid 
            appointments={filterAppointments('scheduled')} 
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="confirmed" className="mt-6">
          <AppointmentGrid 
            appointments={filterAppointments('confirmed')} 
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <AppointmentGrid 
            appointments={filterAppointments('completed')} 
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <AppointmentGrid 
            appointments={filterAppointments('cancelled')} 
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface AppointmentGridProps {
  appointments: WorkshopAppointment[];
  onCancel: (id: string) => void;
  onReschedule: (appointment: WorkshopAppointment) => void;
  onViewDetails: (appointment: WorkshopAppointment) => void;
}

const AppointmentGrid: React.FC<AppointmentGridProps> = ({ 
  appointments, 
  onCancel, 
  onReschedule, 
  onViewDetails 
}) => {
  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No appointments found</h3>
          <p className="text-muted-foreground">No appointments match the current filter.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onCancel={onCancel}
          onReschedule={onReschedule}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default AppointmentsList;
