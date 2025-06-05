
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreateDeviceRequest, DeviceType } from '@/types/gp51-device';

interface GP51CreateDeviceFormProps {
  formData: Partial<CreateDeviceRequest>;
  onFormDataChange: (data: Partial<CreateDeviceRequest>) => void;
  onSubmit: (e: React.FormEvent) => void;
  deviceTypes?: DeviceType[];
  isPending: boolean;
}

const GP51CreateDeviceForm: React.FC<GP51CreateDeviceFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  deviceTypes,
  isPending
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="deviceid">Device ID</Label>
        <Input
          id="deviceid"
          value={formData.deviceid || ''}
          onChange={(e) => onFormDataChange({ ...formData, deviceid: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="devicename">Device Name</Label>
        <Input
          id="devicename"
          value={formData.devicename || ''}
          onChange={(e) => onFormDataChange({ ...formData, devicename: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="devicetype">Device Type</Label>
        <Select 
          value={formData.devicetype?.toString()} 
          onValueChange={(value) => onFormDataChange({ ...formData, devicetype: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {deviceTypes?.map((type) => (
              <SelectItem key={type.devicetypeid} value={type.devicetypeid.toString()}>
                {type.typename}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="groupid">Group ID</Label>
        <Input
          id="groupid"
          type="number"
          value={formData.groupid || 1}
          onChange={(e) => onFormDataChange({ ...formData, groupid: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="timezone">Timezone (GMT offset)</Label>
        <Input
          id="timezone"
          type="number"
          value={formData.timezone || 8}
          onChange={(e) => onFormDataChange({ ...formData, timezone: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="calmileageway">Mileage Calculation</Label>
        <Select 
          value={formData.calmileageway?.toString()} 
          onValueChange={(value) => onFormDataChange({ ...formData, calmileageway: parseInt(value) as 0 | 1 | 2 })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Auto</SelectItem>
            <SelectItem value="1">Device Collect</SelectItem>
            <SelectItem value="2">Platform Collect</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="deviceenable"
          checked={formData.deviceenable === 1}
          onCheckedChange={(checked) => onFormDataChange({ ...formData, deviceenable: checked ? 1 : 0 })}
        />
        <Label htmlFor="deviceenable">Device Enabled</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="loginenable"
          checked={formData.loginenable === 1}
          onCheckedChange={(checked) => onFormDataChange({ ...formData, loginenable: checked ? 1 : 0 })}
        />
        <Label htmlFor="loginenable">Login Enabled</Label>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating...' : 'Create Device'}
      </Button>
    </form>
  );
};

export default GP51CreateDeviceForm;
