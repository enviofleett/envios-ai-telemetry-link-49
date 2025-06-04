
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Users, Car, Database } from 'lucide-react';

interface ConflictIndicatorProps {
  conflicts: any[];
}

const ConflictIndicator: React.FC<ConflictIndicatorProps> = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'duplicate_user':
        return <Users className="h-3 w-3" />;
      case 'duplicate_vehicle':
        return <Car className="h-3 w-3" />;
      case 'data_validation':
        return <Database className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getConflictMessage = (conflict: any) => {
    switch (conflict.type) {
      case 'duplicate_user':
        return `User "${conflict.username}" already exists in the system`;
      case 'duplicate_vehicle':
        return `Vehicle "${conflict.deviceid}" already exists in the system`;
      case 'data_validation':
        return `Data validation issue: ${conflict.message}`;
      default:
        return `Unknown conflict: ${conflict.message || 'See details'}`;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                {getConflictIcon(conflict.type)}
                <span>{getConflictMessage(conflict)}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConflictIndicator;
