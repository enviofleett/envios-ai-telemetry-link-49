
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Car, DollarSign } from 'lucide-react';
import { WorkshopAppointment } from '@/types/workshop-appointment';
import { format } from 'date-fns';

interface AppointmentCardProps {
  appointment: WorkshopAppointment;
  onCancel: (id: string) => void;
  onReschedule: (appointment: WorkshopAppointment) => void;
  onViewDetails: (appointment: WorkshopAppointment) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
  onReschedule,
  onViewDetails
}) => {
  const getStatusBadge = (status: WorkshopAppointment['appointment_status']) => {
    const variants = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: WorkshopAppointment['appointment_type']) => {
    const colors = {
      maintenance: 'bg-blue-50 text-blue-700',
      inspection: 'bg-purple-50 text-purple-700',
      repair: 'bg-orange-50 text-orange-700',
      diagnostic: 'bg-indigo-50 text-indigo-700',
      consultation: 'bg-green-50 text-green-700'
    };

    return (
      <Badge variant="outline" className={colors[type]}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const canCancelOrReschedule = () => {
    return ['scheduled', 'confirmed'].includes(appointment.appointment_status);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5 text-muted-foreground" />
              Vehicle: {appointment.vehicle_id}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(appointment.appointment_status)}
              {getTypeBadge(appointment.appointment_type)}
            </div>
          </div>
          <div className="text-right">
            {appointment.estimated_cost && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                ${appointment.estimated_cost}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(appointment.scheduled_date), 'MMM dd, yyyy')}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(appointment.scheduled_date), 'HH:mm')} 
              ({appointment.duration_minutes}min)
            </span>
          </div>
        </div>

        {appointment.service_description && (
          <div className="text-sm text-muted-foreground">
            <strong>Service:</strong> {appointment.service_description}
          </div>
        )}

        {appointment.notes && (
          <div className="text-sm text-muted-foreground">
            <strong>Notes:</strong> {appointment.notes}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(appointment)}
          >
            View Details
          </Button>
          
          {canCancelOrReschedule() && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReschedule(appointment)}
              >
                Reschedule
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(appointment.id)}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
