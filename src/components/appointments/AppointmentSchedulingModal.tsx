
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { CreateAppointmentData } from '@/types/workshop-appointment';
import { Workshop } from '@/types/workshop';
import { useAppointments } from '@/hooks/useAppointments';

interface AppointmentSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workshop: Workshop;
  vehicleId?: string;
}

const AppointmentSchedulingModal: React.FC<AppointmentSchedulingModalProps> = ({
  isOpen,
  onClose,
  workshop,
  vehicleId
}) => {
  const { createAppointment, getAvailableTimeSlots, isCreating } = useAppointments();
  
  const [formData, setFormData] = useState<CreateAppointmentData>({
    workshop_id: workshop.id,
    vehicle_id: vehicleId || '',
    appointment_type: 'maintenance',
    scheduled_date: '',
    duration_minutes: 60,
    service_description: '',
    estimated_cost: undefined,
    notes: ''
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      setIsLoadingSlots(true);
      getAvailableTimeSlots(workshop.id, dateString)
        .then(slots => {
          setAvailableTimeSlots(slots);
          setSelectedTime('');
        })
        .finally(() => setIsLoadingSlots(false));
    }
  }, [selectedDate, workshop.id, getAvailableTimeSlots]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      return;
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const scheduledDateTime = `${dateString}T${selectedTime}:00`;

    createAppointment({
      ...formData,
      scheduled_date: scheduledDateTime
    });

    // Reset form
    setFormData({
      workshop_id: workshop.id,
      vehicle_id: '',
      appointment_type: 'maintenance',
      scheduled_date: '',
      duration_minutes: 60,
      service_description: '',
      estimated_cost: undefined,
      notes: ''
    });
    setSelectedDate(undefined);
    setSelectedTime('');
    onClose();
  };

  const handleChange = (field: keyof CreateAppointmentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_id">Vehicle ID</Label>
              <Input
                id="vehicle_id"
                value={formData.vehicle_id}
                onChange={(e) => handleChange('vehicle_id', e.target.value)}
                placeholder="Enter vehicle ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_type">Service Type</Label>
              <Select
                value={formData.appointment_type}
                onValueChange={(value) => handleChange('appointment_type', value)}
              >
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Available Times</Label>
              <Select
                value={selectedTime}
                onValueChange={setSelectedTime}
                disabled={!selectedDate || isLoadingSlots}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingSlots ? "Loading..." : 
                    !selectedDate ? "Select date first" : 
                    "Choose time"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={formData.duration_minutes?.toString()}
                onValueChange={(value) => handleChange('duration_minutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
              <Input
                id="estimated_cost"
                type="number"
                step="0.01"
                value={formData.estimated_cost || ''}
                onChange={(e) => handleChange('estimated_cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_description">Service Description</Label>
            <Input
              id="service_description"
              value={formData.service_description || ''}
              onChange={(e) => handleChange('service_description', e.target.value)}
              placeholder="Brief description of the service needed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information or special requirements..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !selectedDate || !selectedTime || !formData.vehicle_id}
            >
              {isCreating ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentSchedulingModal;
