
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ImportStatusBadgeProps {
  status: string;
}

const ImportStatusBadge: React.FC<ImportStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          Processing
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default ImportStatusBadge;
