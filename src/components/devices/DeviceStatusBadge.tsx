
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface DeviceStatusBadgeProps {
  status: 'online' | 'offline' | 'maintenance';
}

const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    online: {
      label: 'Online',
      variant: 'default' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50 text-green-700'
    },
    offline: {
      label: 'Offline',
      variant: 'destructive' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-50 text-red-700'
    },
    maintenance: {
      label: 'Maintenance',
      variant: 'secondary' as const,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 text-yellow-700'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <Circle className={`h-2 w-2 fill-current ${config.color}`} />
      <Badge className={config.bgColor}>
        {config.label}
      </Badge>
    </div>
  );
};

export default DeviceStatusBadge;
