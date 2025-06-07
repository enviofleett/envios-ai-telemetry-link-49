
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import type { VehicleFormData } from '../EnhancedVehicleCreationModal';

interface TechnicalConfigStepProps {
  formData: VehicleFormData;
  updateFormData: (updates: Partial<VehicleFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TIMEZONE_OPTIONS = [
  { value: -12, label: 'GMT-12:00 (Baker Island)' },
  { value: -11, label: 'GMT-11:00 (Samoa)' },
  { value: -10, label: 'GMT-10:00 (Hawaii)' },
  { value: -9, label: 'GMT-09:00 (Alaska)' },
  { value: -8, label: 'GMT-08:00 (Pacific)' },
  { value: -7, label: 'GMT-07:00 (Mountain)' },
  { value: -6, label: 'GMT-06:00 (Central)' },
  { value: -5, label: 'GMT-05:00 (Eastern)' },
  { value: -4, label: 'GMT-04:00 (Atlantic)' },
  { value: 0, label: 'GMT+00:00 (UTC)' },
  { value: 1, label: 'GMT+01:00 (Central Europe)' },
  { value: 2, label: 'GMT+02:00 (Eastern Europe)' },
  { value: 3, label: 'GMT+03:00 (Moscow)' },
  { value: 8, label: 'GMT+08:00 (China)' },
  { value: 9, label: 'GMT+09:00 (Japan)' }
];

const REPORTING_INTERVALS = [
  { value: 10, label: '10 seconds (High frequency)' },
  { value: 30, label: '30 seconds (Standard)' },
  { value: 60, label: '1 minute (Balanced)' },
  { value: 120, label: '2 minutes (Power saving)' },
  { value: 300, label: '5 minutes (Low frequency)' }
];

export const TechnicalConfigStep: React.FC<TechnicalConfigStepProps> = ({
  formData,
  updateFormData,
  onNext,
  onPrevious
}) => {
  const canProceed = () => {
    return formData.reportingInterval > 0;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Technical Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure technical parameters for optimal device performance
          </p>
        </div>

        {/* SIM Number */}
        <div className="space-y-2">
          <Label htmlFor="simNumber">SIM Card Number</Label>
          <Input
            id="simNumber"
            placeholder="Enter SIM card number (optional)"
            value={formData.simNumber}
            onChange={(e) => updateFormData({ simNumber: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            SIM number helps identify the cellular connection for this device
          </p>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Device Timezone</Label>
          <Select
            value={formData.timezone.toString()}
            onValueChange={(value) => updateFormData({ timezone: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONE_OPTIONS.map((tz) => (
                <SelectItem key={tz.value} value={tz.value.toString()}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Set the timezone for accurate timestamp reporting
          </p>
        </div>

        {/* Reporting Interval */}
        <div className="space-y-2">
          <Label htmlFor="reportingInterval">Data Reporting Interval *</Label>
          <Select
            value={formData.reportingInterval.toString()}
            onValueChange={(value) => updateFormData({ reportingInterval: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reporting frequency" />
            </SelectTrigger>
            <SelectContent>
              {REPORTING_INTERVALS.map((interval) => (
                <SelectItem key={interval.value} value={interval.value.toString()}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            More frequent reporting provides better tracking but uses more data
          </p>
        </div>

        {/* Production Settings */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Production Settings</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enableMonitoring">Enable Real-time Monitoring</Label>
              <p className="text-xs text-muted-foreground">
                Monitor device health and connectivity in real-time
              </p>
            </div>
            <Switch
              id="enableMonitoring"
              checked={formData.enableMonitoring}
              onCheckedChange={(checked) => updateFormData({ enableMonitoring: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="performHealthCheck">Perform Health Check</Label>
              <p className="text-xs text-muted-foreground">
                Verify device communication during setup
              </p>
            </div>
            <Switch
              id="performHealthCheck"
              checked={formData.performHealthCheck}
              onCheckedChange={(checked) => updateFormData({ performHealthCheck: checked })}
            />
          </div>
        </div>

        {/* Configuration Summary */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuration Summary:</strong><br />
            Reporting every {formData.reportingInterval} seconds, 
            Timezone: GMT{formData.timezone >= 0 ? '+' : ''}{formData.timezone}:00,
            {formData.enableMonitoring ? ' Monitoring enabled' : ' Monitoring disabled'}
            {formData.performHealthCheck ? ', Health checks enabled' : ', Health checks disabled'}
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={!canProceed()}>
          Next Step
        </Button>
      </div>
    </div>
  );
};
