
import React from 'react';
import { User } from 'lucide-react';

interface VehicleCardDetailsProps {
  simNumber?: string;
  associatedUser?: string;
}

const VehicleCardDetails: React.FC<VehicleCardDetailsProps> = ({
  simNumber,
  associatedUser
}) => {
  if (!simNumber && !associatedUser) return null;

  return (
    <div className="space-y-2">
      {simNumber && (
        <div className="text-sm">
          <span className="font-medium text-gray-600">SIM:</span> {simNumber}
        </div>
      )}
      
      {associatedUser && (
        <div className="flex items-center gap-2 text-sm">
          <User className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">{associatedUser}</span>
        </div>
      )}
    </div>
  );
};

export default VehicleCardDetails;
