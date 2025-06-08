
import { useState, useCallback } from 'react';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleInspectionState {
  selectedVehicle: Vehicle | null;
  isInspectionModalOpen: boolean;
}

export const useVehicleInspection = () => {
  const [state, setState] = useState<VehicleInspectionState>({
    selectedVehicle: null,
    isInspectionModalOpen: false,
  });

  const openInspectionModal = useCallback((vehicle: Vehicle) => {
    setState(prev => ({
      ...prev,
      selectedVehicle: vehicle,
      isInspectionModalOpen: true,
    }));
  }, []);

  const closeInspectionModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInspectionModalOpen: false,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedVehicle: null,
      isInspectionModalOpen: false,
    }));
  }, []);

  return {
    selectedVehicle: state.selectedVehicle,
    isInspectionModalOpen: state.isInspectionModalOpen,
    openInspectionModal,
    closeInspectionModal,
    clearSelection,
  };
};
