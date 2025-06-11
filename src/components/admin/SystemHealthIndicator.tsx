
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

const SystemHealthIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <Badge variant="secondary">
        System Rebuilding
      </Badge>
    </div>
  );
};

export default SystemHealthIndicator;
