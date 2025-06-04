
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface GP51Status {
  connected: boolean;
  username?: string;
  expiresAt?: string;
}

interface GP51ConnectionStatusProps {
  gp51Status?: GP51Status;
  statusLoading: boolean;
}

const GP51ConnectionStatus: React.FC<GP51ConnectionStatusProps> = ({ 
  gp51Status, 
  statusLoading 
}) => {
  const getConnectionStatus = () => {
    if (statusLoading) return { icon: null, text: 'Checking...', variant: 'secondary' as const };
    if (gp51Status?.connected) {
      return { 
        icon: <CheckCircle className="h-4 w-4" />, 
        text: 'Connected', 
        variant: 'default' as const 
      };
    }
    return { 
      icon: <XCircle className="h-4 w-4" />, 
      text: 'Not Connected', 
      variant: 'destructive' as const 
    };
  };

  const status = getConnectionStatus();

  return (
    <div className="p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">GP51 Connection Status:</span>
        <Badge variant={status.variant} className="flex items-center gap-1">
          {status.icon}
          {status.text}
        </Badge>
      </div>
      {gp51Status?.connected && gp51Status?.username && (
        <p className="text-xs text-gray-600 mt-1">
          Connected as: {gp51Status.username}
        </p>
      )}
      {gp51Status?.connected && gp51Status?.expiresAt && (
        <p className="text-xs text-gray-600">
          Token expires: {new Date(gp51Status.expiresAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default GP51ConnectionStatus;
