
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Send, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleData | null;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, vehicle }) => {
  const [alertType, setAlertType] = useState('general');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendAlert = async () => {
    if (!vehicle || !message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate alert sending to vehicle
      console.log('Sending alert to vehicle:', {
        vehicleId: vehicle.device_id,
        type: alertType,
        message,
        priority,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Alert Sent",
        description: `Alert sent successfully to ${vehicle.device_name}`,
      });

      // Reset form
      setMessage('');
      setAlertType('general');
      setPriority('medium');
      onClose();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send alert. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!vehicle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Send Alert to {vehicle.device_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Vehicle: <span className="font-medium">{vehicle.device_name}</span></p>
            <p className="text-sm text-gray-600">ID: <span className="font-medium">{vehicle.device_id}</span></p>
          </div>

          {/* Alert Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Alert Type</label>
            <Select value={alertType} onValueChange={setAlertType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Alert</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="maintenance">Maintenance Required</SelectItem>
                <SelectItem value="route">Route Change</SelectItem>
                <SelectItem value="fuel">Fuel Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Enter your alert message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">{message.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSendAlert} 
              disabled={isSending || !message.trim()}
              className="flex-1"
            >
              {isSending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Alert
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;
