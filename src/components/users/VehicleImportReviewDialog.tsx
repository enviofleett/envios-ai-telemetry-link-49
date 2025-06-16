
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserMappingDialog } from '@/components/users/UserMappingDialog';
import { VehicleData } from '@/types/vehicle';

interface VehicleImportReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importedVehicles: {
    valid: VehicleData[];
    invalid: any[];
  };
  onMappingSuccess: () => void;
}

export const VehicleImportReviewDialog: React.FC<VehicleImportReviewDialogProps> = ({
  open,
  onOpenChange,
  importedVehicles,
  onMappingSuccess
}) => {
  const [showMapUserModal, setShowMapUserModal] = useState(false);

  const handleSuccess = () => {
    onMappingSuccess();
    setShowMapUserModal(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[825px]">
          <DialogHeader>
            <DialogTitle>Review Imported Vehicles</DialogTitle>
            <DialogDescription>
              Here's a summary of the vehicles you've imported. Review the
              details and confirm to proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Valid Vehicles <Badge className="ml-2">{importedVehicles.valid.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto">
                {importedVehicles.valid.length > 0 ? (
                  <Table vehicles={importedVehicles.valid} />
                ) : (
                  <p className="text-sm text-muted-foreground">No valid vehicles.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Invalid Vehicles <Badge className="ml-2">{importedVehicles.invalid.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto">
                {importedVehicles.invalid.length > 0 ? (
                  <Table vehicles={importedVehicles.invalid} isInvalid={true} />
                ) : (
                  <p className="text-sm text-muted-foreground">No invalid vehicles.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => setShowMapUserModal(true)}>
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UserMappingDialog
        open={showMapUserModal}
        onOpenChange={setShowMapUserModal}
        vehicles={importedVehicles.valid}
        onMappingSuccess={handleSuccess}
      />
    </>
  );
};

interface TableProps {
  vehicles: any[];
  isInvalid?: boolean;
}

const Table: React.FC<TableProps> = ({ vehicles, isInvalid }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Device ID
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Device Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {isInvalid ? "Error" : "Status"}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vehicles.map((vehicle, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {vehicle.device_id || vehicle.deviceId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {vehicle.device_name || vehicle.deviceName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {isInvalid ? (
                  <span className="text-red-500">{vehicle.error}</span>
                ) : (
                  <span className="text-green-500">Valid</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
