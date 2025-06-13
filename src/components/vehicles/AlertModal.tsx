import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';

interface AlertModalProps {
  vehicle: VehicleData | null;
  isOpen: boolean;
  onClose: () => void;
}

type AlertType = 'info' | 'warning' | 'urgent' | 'maintenance';

const AlertModal: React.FC<AlertModalProps> = ({
  vehicle,
  isOpen,
  onClose
}) => {
  const [alertType, setAlertType] = useState<AlertType>('info');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!vehicle) return null;

  const alertTypes = [
    { value: 'info', label: 'Information', icon: Info, color: 'text-blue-500' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-yellow-500' },
    { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'text-red-500' },
    { value: 'maintenance', label: 'Maintenance', icon: CheckCircle, color: 'text-green-500' },
  ];

  const selectedAlertType = alertTypes.find(type => type.value === alertType);

  const handleSendAlert = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Alert sent:', {
      vehicleId: vehicle.deviceId,
      type: alertType,
      message: message.trim(),
      timestamp: new Date().toISOString()
    });

    setIsSending(false);
    setMessage('');
    onClose();
  };

  const handleClose = () => {
    setMessage('');
    setAlertType('info');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Alert - {vehicle.deviceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <div className="font-medium">{vehicle.deviceName}</div>
              <div className="text-gray-600">ID: {vehicle.deviceId}</div>
            </div>
          </div>

          {/* Alert Type */}
          <div className="space-y-2">
            <Label htmlFor="alert-type">Alert Type</Label>
            <Select value={alertType} onValueChange={(value: AlertType) => setAlertType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {alertTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your alert message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-gray-500">
              {message.length}/500 characters
            </div>
          </div>

          {/* Preview */}
          {message.trim() && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  {selectedAlertType && (
                    <>
                      <selectedAlertType.icon className={`h-4 w-4 ${selectedAlertType.color}`} />
                      <Badge variant="outline">{selectedAlertType.label}</Badge>
                    </>
                  )}
                </div>
                <div className="text-sm">{message}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendAlert}
              disabled={!message.trim() || isSending}
            >
              {isSending ? 'Sending...' : 'Send Alert'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;
