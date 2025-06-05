
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditDeviceRequest } from '@/types/gp51-device';

interface GP51EditDeviceFormProps {
  formData: Partial<EditDeviceRequest>;
  onFormDataChange: (data: Partial<EditDeviceRequest>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

const GP51EditDeviceForm: React.FC<GP51EditDeviceFormProps> = ({
  formData,
  onFormDataChange,
  onSubmit,
  isPending
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-devicename">Device Name</Label>
        <Input
          id="edit-devicename"
          value={formData.devicename || ''}
          onChange={(e) => onFormDataChange({ ...formData, devicename: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-loginname">Login Name</Label>
        <Input
          id="edit-loginname"
          value={formData.loginname || ''}
          onChange={(e) => onFormDataChange({ ...formData, loginname: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="edit-simnum">SIM Number</Label>
        <Input
          id="edit-simnum"
          value={formData.simnum || ''}
          onChange={(e) => onFormDataChange({ ...formData, simnum: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="edit-remark">Remarks</Label>
        <Input
          id="edit-remark"
          value={formData.remark || ''}
          onChange={(e) => onFormDataChange({ ...formData, remark: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="edit-icon">Icon (0-16)</Label>
        <Input
          id="edit-icon"
          type="number"
          min="0"
          max="16"
          value={formData.icon || 0}
          onChange={(e) => onFormDataChange({ ...formData, icon: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="edit-needloctype">Location Type</Label>
        <Select 
          value={formData.needloctype?.toString()} 
          onValueChange={(value) => onFormDataChange({ ...formData, needloctype: parseInt(value) as 1 | 2 | 7 })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">GPS Only</SelectItem>
            <SelectItem value="2">LBS Only</SelectItem>
            <SelectItem value="7">GPS + LBS + Wifi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Updating...' : 'Update Device'}
      </Button>
    </form>
  );
};

export default GP51EditDeviceForm;
