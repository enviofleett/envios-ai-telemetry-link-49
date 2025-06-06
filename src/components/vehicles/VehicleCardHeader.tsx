
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge } from 'lucide-react';

interface StatusInfo {
  status: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface VehicleCardHeaderProps {
  deviceName: string;
  deviceId: string;
  statusInfo: StatusInfo;
  isOnline: boolean;
}

const VehicleCardHeader: React.FC<VehicleCardHeaderProps> = ({
  deviceName,
  deviceId,
  statusInfo,
  isOnline
}) => {
  const StatusIcon = statusInfo.icon;

  return (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Gauge className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {deviceName}
            </CardTitle>
            <div className="text-sm text-gray-500">ID: {deviceId}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={`flex items-center space-x-1 ${statusInfo.color}`}>
            <StatusIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{statusInfo.status}</span>
          </Badge>
          {isOnline && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Live
            </Badge>
          )}
        </div>
      </div>
    </CardHeader>
  );
};

export default VehicleCardHeader;
