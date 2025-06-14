
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import type { ConnectionStatusBadgeProps } from '../types/connectionTesting';

const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({ result, isLoading, authLoading }) => {
  if (isLoading || authLoading) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <RefreshCw className="h-3 w-3 animate-spin" />
        {isLoading ? 'Testing...' : 'Loading...'}
      </Badge>
    );
  }

  if (!result) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Not Tested
      </Badge>
    );
  }

  if (result.success) {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        Success
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  );
};

export default ConnectionStatusBadge;
