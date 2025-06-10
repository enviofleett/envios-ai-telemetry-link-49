
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreateInspectionData } from '@/types/vehicle-inspection';

interface CreateInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInspectionData) => void;
}

const CreateInspectionModal: React.FC<CreateInspectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<CreateInspectionData>({
    vehicle_id: '',
    workshop_id: '',
    inspection_type: 'routine',
    scheduled_date: '',
    inspection_notes: '',
    estimated_duration_hours: 2
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      vehicle_id: '',
      workshop_id: '',
      inspection_type: 'routine',
      scheduled_date: '',
      inspection_notes: '',
      estimated_duration_hours: 2
    });
  };

  const handleChange = (field: keyof CreateInspectionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Vehicle Inspection</DialogTitle>
          <DialogDescription>
            Create a new inspection appointment for a vehicle.
          </DialogDescription>
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
              <Label htmlFor="inspection_type">Inspection Type</Label>
              <Select
                value={formData.inspection_type}
                onValueChange={(value) => handleChange('inspection_type', value as CreateInspectionData['inspection_type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="pre_purchase">Pre-Purchase</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Scheduled Date & Time</Label>
              <Input
                id="scheduled_date"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => handleChange('scheduled_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration">Estimated Duration (hours)</Label>
              <Input
                id="estimated_duration"
                type="number"
                min="1"
                max="8"
                value={formData.estimated_duration_hours}
                onChange={(e) => handleChange('estimated_duration_hours', parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Inspection Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.inspection_notes || ''}
              onChange={(e) => handleChange('inspection_notes', e.target.value)}
              placeholder="Any special instructions or notes for this inspection..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Inspection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInspectionModal;
