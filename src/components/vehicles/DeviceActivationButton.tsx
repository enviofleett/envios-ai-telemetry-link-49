
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Power, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useDeviceActivation } from '@/hooks/useDeviceActivation';
import { GP51DeviceActivationService } from '@/services/gp51DeviceActivationService';

interface DeviceActivationButtonProps {
  deviceId: string;
  deviceName?: string;
  vehicleId: string;
  adminUserId: string;
  onActivationComplete?: (success: boolean) => void;
}

export const DeviceActivationButton: React.FC<DeviceActivationButtonProps> = ({
  deviceId,
  deviceName,
  vehicleId,
  adminUserId,
  onActivationComplete
}) => {
  const { activateDevice, checkActivationStatus, isActivating } = useDeviceActivation();
  const [activationStatus, setActivationStatus] = useState<'active' | 'inactive' | 'error' | 'unknown'>('unknown');
  const [isChecking, setIsChecking] = useState(false);

  // Check activation status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setIsChecking(true);
      try {
        const result = await checkActivationStatus(deviceId);
        setActivationStatus(result.status);
      } finally {
        setIsChecking(false);
      }
    };

    checkStatus();
  }, [deviceId, checkActivationStatus]);

  const handleActivate = async () => {
    try {
      const result = await activateDevice({
        deviceId,
        deviceName: deviceName || deviceId,
        deviceType: 1, // Default device type
        years: 1,
        adminUserId
      });

      if (result.success) {
        setActivationStatus('active');
        onActivationComplete?.(true);
      } else {
        setActivationStatus('error');
        onActivationComplete?.(false);
      }
    } catch (error) {
      setActivationStatus('error');
      onActivationComplete?.(false);
    }
  };

  const getStatusBadge = () => {
    if (isChecking) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking...
        </Badge>
      );
    }

    switch (activationStatus) {
      case 'active':
        return (
          <Badge variant="default" className="gap-1 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Activated
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-3 w-3" />
            Not Activated
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      
      {activationStatus !== 'active' && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleActivate}
          disabled={isActivating || isChecking}
          className="gap-1"
        >
          {isActivating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Power className="h-3 w-3" />
          )}
          {isActivating ? 'Activating...' : 'Activate'}
        </Button>
      )}
    </div>
  );
};
