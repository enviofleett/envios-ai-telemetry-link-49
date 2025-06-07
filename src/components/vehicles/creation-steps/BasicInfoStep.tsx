
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { SecurityService } from '@/services/securityService';
import type { VehicleFormData } from '../EnhancedVehicleCreationModal';

interface BasicInfoStepProps {
  formData: VehicleFormData;
  updateFormData: (updates: Partial<VehicleFormData>) => void;
  onNext: () => void;
}

const DEVICE_TYPES = [
  { id: 1, name: 'GPS Tracker', description: 'Standard vehicle tracking device' },
  { id: 2, name: 'OBD Device', description: 'Diagnostic port connected tracker' },
  { id: 3, name: 'Asset Tracker', description: 'For non-vehicle assets' },
  { id: 4, name: 'Personal Tracker', description: 'Portable tracking device' }
];

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  updateFormData,
  onNext
}) => {
  const [validationStatus, setValidationStatus] = useState<{
    deviceId: 'idle' | 'checking' | 'valid' | 'invalid';
    imei: 'idle' | 'checking' | 'valid' | 'invalid';
  }>({
    deviceId: 'idle',
    imei: 'idle'
  });

  const [validationErrors, setValidationErrors] = useState<{
    deviceId?: string;
    imei?: string;
    deviceName?: string;
  }>({});

  // Real-time validation for Device ID
  useEffect(() => {
    if (formData.deviceId.length >= 3) {
      setValidationStatus(prev => ({ ...prev, deviceId: 'checking' }));
      
      const validateDeviceId = async () => {
        try {
          const validation = SecurityService.validateInput(formData.deviceId, 'deviceId');
          if (validation.isValid) {
            setValidationStatus(prev => ({ ...prev, deviceId: 'valid' }));
            setValidationErrors(prev => ({ ...prev, deviceId: undefined }));
          } else {
            setValidationStatus(prev => ({ ...prev, deviceId: 'invalid' }));
            setValidationErrors(prev => ({ ...prev, deviceId: validation.error }));
          }
        } catch (error) {
          setValidationStatus(prev => ({ ...prev, deviceId: 'invalid' }));
          setValidationErrors(prev => ({ ...prev, deviceId: 'Validation failed' }));
        }
      };

      const timeoutId = setTimeout(validateDeviceId, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setValidationStatus(prev => ({ ...prev, deviceId: 'idle' }));
    }
  }, [formData.deviceId]);

  // Real-time validation for IMEI
  useEffect(() => {
    if (formData.imei.length >= 10) {
      setValidationStatus(prev => ({ ...prev, imei: 'checking' }));
      
      const validateImei = async () => {
        try {
          const validation = SecurityService.validateInput(formData.imei, 'imei');
          if (validation.isValid) {
            setValidationStatus(prev => ({ ...prev, imei: 'valid' }));
            setValidationErrors(prev => ({ ...prev, imei: undefined }));
          } else {
            setValidationStatus(prev => ({ ...prev, imei: 'invalid' }));
            setValidationErrors(prev => ({ ...prev, imei: validation.error }));
          }
        } catch (error) {
          setValidationStatus(prev => ({ ...prev, imei: 'invalid' }));
          setValidationErrors(prev => ({ ...prev, imei: 'IMEI validation failed' }));
        }
      };

      const timeoutId = setTimeout(validateImei, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setValidationStatus(prev => ({ ...prev, imei: 'idle' }));
    }
  }, [formData.imei]);

  const getValidationIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    return (
      formData.deviceId.length >= 3 &&
      formData.deviceName.length >= 3 &&
      formData.deviceType > 0 &&
      formData.imei.length >= 10 &&
      validationStatus.deviceId === 'valid' &&
      validationStatus.imei === 'valid' &&
      Object.keys(validationErrors).length === 0
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Basic Device Information</h3>
          <p className="text-sm text-muted-foreground">
            Enter the basic information for your new vehicle tracking device
          </p>
        </div>

        {/* Device ID */}
        <div className="space-y-2">
          <Label htmlFor="deviceId">Device ID *</Label>
          <div className="relative">
            <Input
              id="deviceId"
              placeholder="Enter unique device identifier"
              value={formData.deviceId}
              onChange={(e) => updateFormData({ deviceId: e.target.value })}
              className={`pr-10 ${
                validationStatus.deviceId === 'valid' ? 'border-green-500' :
                validationStatus.deviceId === 'invalid' ? 'border-red-500' : ''
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon(validationStatus.deviceId)}
            </div>
          </div>
          {validationErrors.deviceId && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationErrors.deviceId}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Device Name */}
        <div className="space-y-2">
          <Label htmlFor="deviceName">Device Name *</Label>
          <Input
            id="deviceName"
            placeholder="Enter a friendly name for this device"
            value={formData.deviceName}
            onChange={(e) => updateFormData({ deviceName: e.target.value })}
          />
          {formData.deviceName.length > 0 && formData.deviceName.length < 3 && (
            <p className="text-sm text-muted-foreground">Name must be at least 3 characters</p>
          )}
        </div>

        {/* Device Type */}
        <div className="space-y-2">
          <Label htmlFor="deviceType">Device Type *</Label>
          <Select
            value={formData.deviceType.toString()}
            onValueChange={(value) => updateFormData({ deviceType: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select device type" />
            </SelectTrigger>
            <SelectContent>
              {DEVICE_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* IMEI */}
        <div className="space-y-2">
          <Label htmlFor="imei">IMEI Number *</Label>
          <div className="relative">
            <Input
              id="imei"
              placeholder="Enter 15-digit IMEI number"
              value={formData.imei}
              onChange={(e) => updateFormData({ imei: e.target.value })}
              className={`pr-10 ${
                validationStatus.imei === 'valid' ? 'border-green-500' :
                validationStatus.imei === 'invalid' ? 'border-red-500' : ''
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon(validationStatus.imei)}
            </div>
          </div>
          {validationErrors.imei && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationErrors.imei}</AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            IMEI is required for production vehicle deployment and device authentication
          </p>
        </div>
      </div>

      {/* Validation Summary */}
      {(validationStatus.deviceId === 'valid' && validationStatus.imei === 'valid') && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All basic information validated successfully. Ready to proceed to technical configuration.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={onNext}
          disabled={!canProceed()}
          className="min-w-24"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
};
