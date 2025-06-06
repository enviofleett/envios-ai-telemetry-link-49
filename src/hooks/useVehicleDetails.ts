
import { useState, useCallback } from 'react';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleDetailsState {
  selectedVehicle: Vehicle | null;
  isDetailsModalOpen: boolean;
  isTripHistoryModalOpen: boolean;
  isAlertModalOpen: boolean;
}

export const useVehicleDetails = () => {
  const [state, setState] = useState<VehicleDetailsState>({
    selectedVehicle: null,
    isDetailsModalOpen: false,
    isTripHistoryModalOpen: false,
    isAlertModalOpen: false,
  });

  const openDetailsModal = useCallback((vehicle: Vehicle) => {
    setState(prev => ({
      ...prev,
      selectedVehicle: vehicle,
      isDetailsModalOpen: true,
    }));
  }, []);

  const closeDetailsModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDetailsModalOpen: false,
    }));
  }, []);

  const openTripHistoryModal = useCallback((vehicle: Vehicle) => {
    setState(prev => ({
      ...prev,
      selectedVehicle: vehicle,
      isTripHistoryModalOpen: true,
    }));
  }, []);

  const closeTripHistoryModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTripHistoryModalOpen: false,
    }));
  }, []);

  const openAlertModal = useCallback((vehicle: Vehicle) => {
    setState(prev => ({
      ...prev,
      selectedVehicle: vehicle,
      isAlertModalOpen: true,
    }));
  }, []);

  const closeAlertModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAlertModalOpen: false,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedVehicle: null,
      isDetailsModalOpen: false,
      isTripHistoryModalOpen: false,
      isAlertModalOpen: false,
    }));
  }, []);

  return {
    selectedVehicle: state.selectedVehicle,
    isDetailsModalOpen: state.isDetailsModalOpen,
    isTripHistoryModalOpen: state.isTripHistoryModalOpen,
    isAlertModalOpen: state.isAlertModalOpen,
    openDetailsModal,
    closeDetailsModal,
    openTripHistoryModal,
    closeTripHistoryModal,
    openAlertModal,
    closeAlertModal,
    clearSelection,
  };
};
