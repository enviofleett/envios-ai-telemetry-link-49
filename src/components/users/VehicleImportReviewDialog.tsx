
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Car, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import UserMappingDialog from './UserMappingDialog';

interface BackupVehicle {
  device_id: string;
  device_name: string;
  gp51_username: string;
  device_type?: string;
  notes?: string;
}

interface VehicleImportReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VehicleImportReviewDialog: React.FC<VehicleImportReviewDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { toast } = useToast();

  // Fetch backup vehicles
  const { data: backupVehicles, isLoading } = useQuery({
    queryKey: ['backup-vehicles'],
    queryFn: async (): Promise<BackupVehicle[]> => {
      const { data, error } = await supabase
        .from('vehicle_assignment_backup_20250605')
        .select('device_id, device_name, gp51_username, device_type, notes')
        .order('device_name');
      
      if (error) {
        console.error('Error fetching backup vehicles:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: open
  });

  // Filter and paginate vehicles
  const filteredVehicles = useMemo(() => {
    if (!backupVehicles) return [];
    
    return backupVehicles.filter(vehicle =>
      vehicle.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.device_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [backupVehicles, searchTerm]);

  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(startIndex, startIndex + pageSize);
  }, [filteredVehicles, currentPage]);

  const totalPages = Math.ceil(filteredVehicles.length / pageSize);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVehicles(paginatedVehicles.map(v => v.device_id));
    } else {
      setSelectedVehicles([]);
    }
  };

  const handleSelectVehicle = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedVehicles([...selectedVehicles, deviceId]);
    } else {
      setSelectedVehicles(selectedVehicles.filter(id => id !== deviceId));
    }
  };

  const handleProceedToMapping = () => {
    if (selectedVehicles.length === 0) {
      toast({
        title: 'No vehicles selected',
        description: 'Please select at least one vehicle to proceed with mapping.',
        variant: 'destructive'
      });
      return;
    }
    setShowMappingDialog(true);
  };

  const selectedVehicleData = useMemo(() => {
    return backupVehicles?.filter(v => selectedVehicles.includes(v.device_id)) || [];
  }, [backupVehicles, selectedVehicles]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vehicle Import Review - Backup Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600">Total Available</div>
                <div className="text-xl font-bold text-blue-900">
                  {backupVehicles?.length || 0}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600">Filtered Results</div>
                <div className="text-xl font-bold text-green-900">
                  {filteredVehicles.length}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-sm text-orange-600">Selected</div>
                <div className="text-xl font-bold text-orange-900">
                  {selectedVehicles.length}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600">Original User</div>
                <div className="text-sm font-bold text-purple-900">
                  08144225467
                </div>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by vehicle name or device ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="max-w-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Page {currentPage} of {totalPages}
                </Badge>
                <Button
                  onClick={handleProceedToMapping}
                  disabled={selectedVehicles.length === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Map Selected ({selectedVehicles.length})
                </Button>
              </div>
            </div>

            {/* Vehicle Table */}
            <div className="border rounded-lg overflow-hidden flex-1">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedVehicles.length === paginatedVehicles.length && paginatedVehicles.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Vehicle Name</TableHead>
                      <TableHead>Device Type</TableHead>
                      <TableHead>Original User</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                            Loading backup vehicles...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="text-gray-500">
                            {searchTerm ? 'No vehicles found matching your search' : 'No vehicles available'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedVehicles.map((vehicle) => (
                        <TableRow key={vehicle.device_id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedVehicles.includes(vehicle.device_id)}
                              onCheckedChange={(checked) => 
                                handleSelectVehicle(vehicle.device_id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {vehicle.device_id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {vehicle.device_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {vehicle.device_type || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {vehicle.gp51_username}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-32 truncate">
                            {vehicle.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToMapping}
              disabled={selectedVehicles.length === 0}
              className="flex-1"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Map {selectedVehicles.length} Vehicle(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UserMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        selectedVehicles={selectedVehicleData}
        onMappingComplete={() => {
          setShowMappingDialog(false);
          onOpenChange(false);
          setSelectedVehicles([]);
        }}
      />
    </>
  );
};

export default VehicleImportReviewDialog;
