
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Users, AlertTriangle } from 'lucide-react';
import { useVehicleBulkOperations } from '@/hooks/useVehicleBulkOperations';
import type { VehicleData } from '@/types/vehicle';

interface VehicleBulkOperationsProps {
  selectedVehicles: VehicleData[];
  onClearSelection: () => void;
  onOperationComplete: () => void;
  availableUsers?: Array<{ id: string; name: string; email: string }>;
}

type BulkOperation = 'delete' | 'assign' | 'export' | null;

export const VehicleBulkOperations: React.FC<VehicleBulkOperationsProps> = ({
  selectedVehicles,
  onClearSelection,
  onOperationComplete,
  availableUsers = []
}) => {
  const { bulkDelete, bulkAssignUser, exportToCSV, isProcessing, progress } = useVehicleBulkOperations();
  const [currentOperation, setCurrentOperation] = useState<BulkOperation>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const handleBulkDelete = async () => {
    if (selectedVehicles.length === 0) return;

    const vehicleIds = selectedVehicles.map(v => v.id);
    await bulkDelete(vehicleIds);
    
    setCurrentOperation(null);
    onClearSelection();
    onOperationComplete();
  };

  const handleBulkAssign = async () => {
    if (selectedVehicles.length === 0 || !selectedUserId) return;

    const vehicleIds = selectedVehicles.map(v => v.id);
    await bulkAssignUser(vehicleIds, selectedUserId);
    
    setCurrentOperation(null);
    setSelectedUserId('');
    onClearSelection();
    onOperationComplete();
  };

  const handleExport = () => {
    exportToCSV(selectedVehicles);
    onClearSelection();
  };

  const closeModal = () => {
    if (!isProcessing) {
      setCurrentOperation(null);
      setSelectedUserId('');
    }
  };

  if (selectedVehicles.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Operations Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {selectedVehicles.length} vehicle{selectedVehicles.length !== 1 ? 's' : ''} selected
            </Badge>
            <span className="text-sm text-gray-600">
              Bulk operations available:
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentOperation('delete')}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentOperation('assign')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Assign User
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={currentOperation === 'delete'} onOpenChange={closeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Bulk Delete
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                This action cannot be undone. {selectedVehicles.length} vehicle{selectedVehicles.length !== 1 ? 's' : ''} will be permanently deleted.
              </AlertDescription>
            </Alert>

            <div className="max-h-48 overflow-y-auto space-y-2">
              <p className="text-sm font-medium">Vehicles to be deleted:</p>
              {selectedVehicles.map((vehicle) => (
                <div key={vehicle.id} className="text-sm p-2 bg-gray-50 rounded">
                  <span className="font-medium">{vehicle.device_name}</span>
                  <span className="text-gray-500 ml-2">({vehicle.device_id})</span>
                </div>
              ))}
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Deleting vehicles...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Deleting...' : 'Delete All'}
              </Button>
              <Button 
                variant="outline" 
                onClick={closeModal}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Modal */}
      <Dialog open={currentOperation === 'assign'} onOpenChange={closeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk User Assignment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Assign {selectedVehicles.length} vehicle{selectedVehicles.length !== 1 ? 's' : ''} to a user:
              </p>
              
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user to assign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Remove assignment</SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                <p className="text-sm font-medium">Vehicles to be assigned:</p>
                {selectedVehicles.slice(0, 5).map((vehicle) => (
                  <div key={vehicle.id} className="text-sm p-1">
                    {vehicle.device_name} ({vehicle.device_id})
                  </div>
                ))}
                {selectedVehicles.length > 5 && (
                  <div className="text-sm text-gray-500">
                    ...and {selectedVehicles.length - 5} more
                  </div>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Assigning vehicles...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleBulkAssign}
                disabled={isProcessing || !selectedUserId}
                className="flex-1"
              >
                {isProcessing ? 'Assigning...' : 'Assign Vehicles'}
              </Button>
              <Button 
                variant="outline" 
                onClick={closeModal}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VehicleBulkOperations;
