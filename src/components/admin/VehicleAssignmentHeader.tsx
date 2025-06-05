
import React from 'react';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw } from 'lucide-react';

interface VehicleAssignmentHeaderProps {
  onValidateIntegrity: () => void;
  onRefresh: () => void;
  isValidating: boolean;
}

const VehicleAssignmentHeader = ({ 
  onValidateIntegrity, 
  onRefresh, 
  isValidating 
}: VehicleAssignmentHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Vehicle Assignment Manager</h2>
        <p className="text-gray-600 mt-1">Monitor and manage vehicle-user assignments</p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onValidateIntegrity}
          disabled={isValidating}
          variant="outline"
          size="sm"
        >
          <Database className="h-4 w-4 mr-2" />
          {isValidating ? 'Validating...' : 'Check Data Integrity'}
        </Button>
        <Button 
          onClick={onRefresh}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default VehicleAssignmentHeader;
