
import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { MapApiConfig } from './types';
import { getAlertLevel } from './utils';

interface StatusBadgeProps {
  config: MapApiConfig;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ config }) => {
  if (!config.is_active) {
    return <Badge variant="secondary">Inactive</Badge>;
  }
  
  const alertLevel = getAlertLevel(config);
  
  switch (alertLevel.level) {
    case 'critical':
      return <Badge className="bg-red-500 text-white">Critical Usage</Badge>;
    case 'high':
      return <Badge className="bg-orange-500 text-white">High Usage</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-500 text-white">Warning</Badge>;
    default:
      return <Badge className="bg-green-500 text-white">Active</Badge>;
  }
};

export default StatusBadge;
