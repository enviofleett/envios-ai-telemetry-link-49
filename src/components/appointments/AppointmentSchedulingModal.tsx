
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAppointments } from '@/hooks/useAppointments';
import { Workshop, WorkshopAppointment } from '@/types/workshop';

interface AppointmentSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workshop: Workshop;
  vehicles?: { id: string; name: string }[];
}

const AppointmentSchedulingModal: React.FC<AppointmentSchedulingModalProps> = ({
  isOpen,
  onClose,
  workshop,
  vehicles = []
}) => {
  const { createAppointment, isCreating } = useAppointments();
  const { toast } = useToast();
  
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<WorkshopAppointment['appointment_type']>('maintenance');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState<number>(60); // Default 60 minutes
  const [serviceDescription, setServiceDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | undefined>();
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicle || !scheduledDate || !scheduledTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const appointmentData = {
      workshop_id: workshop.id,
      vehicle_id: selectedVehicle,
      appointment_type: appointmentType,
      scheduled_date: `${scheduledDate}T${scheduledTime}:00.000Z`,
      duration_minutes: duration, // Now required and has default value
      service_description: serviceDescription || undefined,
      estimated_cost: estimatedCost,
      notes: notes || undefined
    };

    try {
      createAppointment(appointmentData);
      onClose();
      // Reset form
      setSelectedVehicle('');
      setScheduledDate('');
      setScheduledTime('');
      setDuration(60);
      setServiceDescription('');
      setEstimatedCost(undefined);
      setNotes('');
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Book a service appointment with {workshop.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vehicle">Vehicle *</Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="placeholder-vehicle" disabled>
                    No vehicles available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="appointmentType">Service Type *</Label>
            <Select value={appointmentType} onValueChange={(value) => setAppointmentType(value as WorkshopAppointment['appointment_type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="diagnostic">Diagnostic</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              max="480"
              step="15"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="serviceDescription">Service Description</Label>
            <Textarea
              id="serviceDescription"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              placeholder="Describe the service needed..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="estimatedCost">Estimated Cost</Label>
            <Input
              id="estimatedCost"
              type="number"
              min="0"
              step="0.01"
              value={estimatedCost || ''}
              onChange={(e) => setEstimatedCost(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Enter estimated cost"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or special requests..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentSchedulingModal;
