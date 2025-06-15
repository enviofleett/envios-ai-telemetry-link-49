
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { VehicleData } from '@/types/vehicle';

interface VehicleAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleData | null;
}

export const VehicleAnalyticsModal: React.FC<VehicleAnalyticsModalProps> = ({
  isOpen,
  onClose,
  vehicle,
}) => {
  if (!vehicle) return null;

  const renderDriver = () => {
    if (!vehicle.driver) return 'N/A';
    if (typeof vehicle.driver === 'object' && vehicle.driver.name) {
      return vehicle.driver.name;
    }
    return String(vehicle.driver);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vehicle Analytics: {vehicle.device_name}</DialogTitle>
          <DialogDescription>
            Detailed information and analytics for the selected vehicle.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Device ID</TableCell>
                <TableCell>{vehicle.device_id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>{vehicle.status}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell>{renderDriver()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Fuel Level</TableCell>
                <TableCell>{vehicle.fuel ?? 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mileage</TableCell>
                <TableCell>{vehicle.mileage ?? 'N/A'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
