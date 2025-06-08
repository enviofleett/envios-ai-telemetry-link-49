
import React from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Trash2 } from 'lucide-react';
import { ActiveService, ServiceUpdateRequest } from '@/types/active-services';

interface ServiceDialogActionsProps {
  selectedService: ActiveService | null;
  onClose: () => void;
  onServiceUpdate: (serviceId: string, updates: ServiceUpdateRequest) => void;
  onServiceCancel: (serviceId: string) => void;
}

const ServiceDialogActions: React.FC<ServiceDialogActionsProps> = ({
  selectedService,
  onClose,
  onServiceUpdate,
  onServiceCancel,
}) => {
  if (!selectedService) {
    return (
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            const newStatus = selectedService.status === 'active' ? 'paused' : 'active';
            onServiceUpdate(selectedService.id, { status: newStatus });
          }}
        >
          <Pause className="h-4 w-4 mr-2" />
          {selectedService.status === 'active' ? 'Pause' : 'Resume'} Service
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (window.confirm('Are you sure you want to cancel this service? This action cannot be undone.')) {
              onServiceCancel(selectedService.id);
              onClose();
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Cancel Service
        </Button>
      </div>
    </div>
  );
};

export default ServiceDialogActions;
