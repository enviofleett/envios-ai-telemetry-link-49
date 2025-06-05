
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Settings, Activity, Circle } from 'lucide-react';

interface GP51DeviceCardProps {
  device: any;
  onEdit: (device: any) => void;
  onDelete: (deviceId: string) => void;
  isSelected: boolean;
  onSelect: () => void;
  viewMode: 'grid' | 'list';
}

const GP51DeviceCard: React.FC<GP51DeviceCardProps> = ({
  device,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  viewMode
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'enabled': return 'text-green-500';
      case 'disabled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getActiveStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Circle className="w-2 h-2 mr-1 fill-current" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800">
        <Circle className="w-2 h-2 mr-1 fill-current" />
        Inactive
      </Badge>
    );
  };

  if (viewMode === 'list') {
    return (
      <Card className={`${isSelected ? 'ring-2 ring-blue-500' : ''} hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="rounded"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{device.device_name}</h3>
                  {getActiveStatusBadge(device.is_active)}
                </div>
                <p className="text-sm text-gray-600">ID: {device.device_id}</p>
                {device.sim_number && (
                  <p className="text-xs text-gray-500">SIM: {device.sim_number}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Activity className={`h-4 w-4 ${getStatusColor(device.status)}`} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(device)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(device.device_id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isSelected ? 'ring-2 ring-blue-500' : ''} hover:shadow-lg transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded"
            />
            <div>
              <h3 className="font-medium">{device.device_name}</h3>
              <p className="text-sm text-gray-600">ID: {device.device_id}</p>
            </div>
          </div>
          {getActiveStatusBadge(device.is_active)}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <div className="flex items-center gap-1">
              <Activity className={`h-3 w-3 ${getStatusColor(device.status)}`} />
              <span className="capitalize">{device.status || 'Unknown'}</span>
            </div>
          </div>
          
          {device.sim_number && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">SIM:</span>
              <span>{device.sim_number}</span>
            </div>
          )}
          
          {device.gp51_metadata?.devicetype && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Type:</span>
              <span>{device.gp51_metadata.devicetype}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(device)}
            className="flex-1"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(device.device_id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51DeviceCard;
