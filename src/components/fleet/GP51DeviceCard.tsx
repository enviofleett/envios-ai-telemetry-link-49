
import React from 'react';
import { Edit, Trash2, Car, Smartphone, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface GP51DeviceCardProps {
  device: any;
  onEdit: (device: any) => void;
  onDelete: (deviceId: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  viewMode?: 'grid' | 'list';
}

const GP51DeviceCard: React.FC<GP51DeviceCardProps> = ({
  device,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  viewMode = 'grid'
}) => {
  if (viewMode === 'list') {
    return (
      <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelect}
                />
              )}
              
              <div className="bg-blue-100 p-2 rounded-full">
                <Car className="h-4 w-4 text-blue-600" />
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="font-medium">{device.device_name}</div>
                  <div className="text-sm text-gray-500">ID: {device.device_id}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={device.is_active ? 'default' : 'secondary'}>
                    {device.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {device.status && (
                    <Badge variant="outline">{device.status}</Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  {device.sim_number && (
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      {device.sim_number}
                    </div>
                  )}
                  {device.gp51_username && (
                    <div>Owner: {device.gp51_username}</div>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  {device.gp51_metadata?.timezone && (
                    <div>Timezone: GMT+{device.gp51_metadata.timezone}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(device)}>
                <Edit className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(device)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(device.device_id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
              />
            )}
            <div className="bg-blue-100 p-2 rounded-full">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{device.device_name}</CardTitle>
              <div className="text-sm text-gray-500">ID: {device.device_id}</div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(device)}>
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
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={device.is_active ? 'default' : 'secondary'}>
            {device.is_active ? 'Active' : 'Inactive'}
          </Badge>
          {device.status && (
            <Badge variant="outline">{device.status}</Badge>
          )}
        </div>
        {device.sim_number && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Smartphone className="h-3 w-3" />
            SIM: {device.sim_number}
          </div>
        )}
        {device.gp51_username && (
          <div className="text-sm text-gray-600">
            <strong>Owner:</strong> {device.gp51_username}
          </div>
        )}
        {device.gp51_metadata?.timezone && (
          <div className="text-sm text-gray-600">
            <strong>Timezone:</strong> GMT+{device.gp51_metadata.timezone}
          </div>
        )}
        {device.notes && (
          <div className="text-sm text-gray-600">
            <strong>Notes:</strong> {device.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51DeviceCard;
