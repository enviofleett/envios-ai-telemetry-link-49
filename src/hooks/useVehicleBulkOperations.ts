
import { useState, useCallback } from 'react';
import { SecureVehicleService } from '@/services/secureVehicleService';
import { useToast } from '@/hooks/use-toast';
import type { VehicleData } from '@/types/vehicle';

interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  total: number;
}

export const useVehicleBulkOperations = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const bulkDelete = useCallback(async (vehicleIds: string[]): Promise<BulkOperationResult> => {
    setIsProcessing(true);
    setProgress(0);

    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      total: vehicleIds.length
    };

    try {
      for (let i = 0; i < vehicleIds.length; i++) {
        const vehicleId = vehicleIds[i];
        
        try {
          const deleteResult = await SecureVehicleService.deleteSecureVehicle(vehicleId);
          
          if (deleteResult.success) {
            result.successful.push(vehicleId);
          } else {
            result.failed.push({
              id: vehicleId,
              error: deleteResult.error || 'Unknown error'
            });
          }
        } catch (error) {
          result.failed.push({
            id: vehicleId,
            error: error instanceof Error ? error.message : 'Deletion failed'
          });
        }

        setProgress(Math.round(((i + 1) / vehicleIds.length) * 100));
      }

      // Show toast notification
      if (result.successful.length > 0) {
        toast({
          title: "Bulk Delete Completed",
          description: `${result.successful.length} vehicle(s) deleted successfully${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`,
        });
      }

      if (result.failed.length > 0 && result.successful.length === 0) {
        toast({
          title: "Bulk Delete Failed",
          description: `Failed to delete ${result.failed.length} vehicle(s)`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Bulk Delete Error",
        description: "An unexpected error occurred during bulk delete",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }

    return result;
  }, [toast]);

  const bulkAssignUser = useCallback(async (
    vehicleIds: string[], 
    userId: string
  ): Promise<BulkOperationResult> => {
    setIsProcessing(true);
    setProgress(0);

    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      total: vehicleIds.length
    };

    try {
      for (let i = 0; i < vehicleIds.length; i++) {
        const vehicleId = vehicleIds[i];
        
        try {
          const updateResult = await SecureVehicleService.updateSecureVehicle(vehicleId, {
            user_id: userId
          });
          
          if (updateResult.success) {
            result.successful.push(vehicleId);
          } else {
            result.failed.push({
              id: vehicleId,
              error: updateResult.error || 'Unknown error'
            });
          }
        } catch (error) {
          result.failed.push({
            id: vehicleId,
            error: error instanceof Error ? error.message : 'Assignment failed'
          });
        }

        setProgress(Math.round(((i + 1) / vehicleIds.length) * 100));
      }

      if (result.successful.length > 0) {
        toast({
          title: "Bulk Assignment Completed",
          description: `${result.successful.length} vehicle(s) assigned successfully${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`,
        });
      }

    } catch (error) {
      console.error('Bulk assignment error:', error);
      toast({
        title: "Bulk Assignment Error",
        description: "An unexpected error occurred during bulk assignment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }

    return result;
  }, [toast]);

  const exportToCSV = useCallback((vehicles: VehicleData[], filename?: string) => {
    try {
      const headers = [
        'Vehicle ID',
        'Device ID', 
        'Vehicle Name',
        'Assigned User',
        'SIM Number',
        'Status',
        'Created Date',
        'Last Update'
      ];

      const csvData = vehicles.map(vehicle => [
        vehicle.id,
        vehicle.device_id,
        vehicle.device_name,
        vehicle.envio_users?.name || vehicle.envio_users?.email || 'Unassigned',
        vehicle.sim_number || '',
        vehicle.status,
        new Date(vehicle.created_at).toLocaleDateString(),
        new Date(vehicle.updated_at).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename || `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Export Successful",
        description: `${vehicles.length} vehicle(s) exported to CSV`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export vehicles to CSV",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    bulkDelete,
    bulkAssignUser,
    exportToCSV,
    isProcessing,
    progress
  };
};
