
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    deviceId: '',
    vehicleId: '',
    deviceType: '',
    model: '',
    imeiNumber: '',
    installationNotes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real implementation, this would call API to add device
    console.log('Adding device:', formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      deviceId: '',
      vehicleId: '',
      deviceType: '',
      model: '',
      imeiNumber: '',
      installationNotes: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Add New Device</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Configure a new GPS tracking device for a vehicle
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device-id">Device ID</Label>
              <Input
                id="device-id"
                placeholder="GPS-XXXX"
                value={formData.deviceId}
                onChange={(e) => handleInputChange('deviceId', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicle-id">Vehicle ID</Label>
              <Select
                value={formData.vehicleId}
                onValueChange={(value) => handleInputChange('vehicleId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vh-001">VH-001</SelectItem>
                  <SelectItem value="vh-002">VH-002</SelectItem>
                  <SelectItem value="vh-003">VH-003</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device-type">Device Type</Label>
              <Select
                value={formData.deviceType}
                onValueChange={(value) => handleInputChange('deviceType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="GPS Tracker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gps-tracker">GPS Tracker</SelectItem>
                  <SelectItem value="obd-device">OBD Device</SelectItem>
                  <SelectItem value="dash-camera">Dash Camera</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => handleInputChange('model', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="GT06N" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gt06n">GT06N</SelectItem>
                  <SelectItem value="tk102">TK102</SelectItem>
                  <SelectItem value="st901">ST901</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imei">IMEI Number</Label>
            <Input
              id="imei"
              placeholder="860123456789012"
              value={formData.imeiNumber}
              onChange={(e) => handleInputChange('imeiNumber', e.target.value)}
              pattern="[0-9]{15}"
              title="IMEI must be 15 digits"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Installation Notes</Label>
            <Textarea
              id="notes"
              placeholder="Installation details and notes..."
              value={formData.installationNotes}
              onChange={(e) => handleInputChange('installationNotes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Device</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeviceModal;
