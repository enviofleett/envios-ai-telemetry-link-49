
import React, { useState } from 'react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { useVehicleDetails } from '@/hooks/useVehicleDetails';
import LiveTrackingHeader from '@/components/tracking/LiveTrackingHeader';
import LiveTrackingStats from '@/components/tracking/LiveTrackingStats';
import LiveMapAndVehicleList from '@/components/tracking/LiveMapAndVehicleList';
import ReportsHub from '@/components/tracking/ReportsHub';
import VehicleDetailsModal from '@/components/vehicles/VehicleDetailsModal';
import TripHistoryModal from '@/components/vehicles/TripHistoryModal';
import AlertModal from '@/components/vehicles/AlertModal';

const LiveTracking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'alerts'>('all');

  const { 
    vehicles, 
    metrics, 
    syncMetrics, 
    isLoading, 
    isRefreshing, 
    forceRefresh,
    getVehiclesByStatus 
  } = useUnifiedVehicleData({
    search: searchTerm,
    status: statusFilter
  });

  const {
    selectedVehicle,
    isDetailsModalOpen,
    isTripHistoryModalOpen,
    isAlertModalOpen,
    openDetailsModal,
    closeDetailsModal,
    openTripHistoryModal,
    closeTripHistoryModal,
    openAlertModal,
    closeAlertModal,
  } = useVehicleDetails();

  const vehiclesByStatus = getVehiclesByStatus();

  const handleVehicleSelect = (vehicle: any) => {
    console.log('Vehicle selected:', vehicle);
    openDetailsModal(vehicle);
  };

  const handleTripHistory = (vehicle: any) => {
    console.log('Trip history requested for:', vehicle);
    openTripHistoryModal(vehicle);
  };

  const handleSendAlert = (vehicle: any) => {
    console.log('Send alert requested for:', vehicle);
    openAlertModal(vehicle);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-600 mt-2">Real-time vehicle location and status monitoring</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LiveTrackingHeader 
        viewMode="cards"
        onViewModeChange={() => {}}
      />

      <LiveTrackingStats 
        metrics={metrics}
        syncMetrics={syncMetrics}
        vehiclesByStatus={vehiclesByStatus}
      />

      <LiveMapAndVehicleList
        vehicles={vehicles}
        onVehicleSelect={handleVehicleSelect}
        onTripHistory={handleTripHistory}
        onSendAlert={handleSendAlert}
      />

      <ReportsHub
        vehicles={vehicles}
      />

      {/* Modals */}
      <VehicleDetailsModal
        vehicle={selectedVehicle}
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        onViewHistory={openTripHistoryModal}
        onSendAlert={openAlertModal}
      />

      <TripHistoryModal
        vehicle={selectedVehicle}
        isOpen={isTripHistoryModalOpen}
        onClose={closeTripHistoryModal}
      />

      <AlertModal
        vehicle={selectedVehicle}
        isOpen={isAlertModalOpen}
        onClose={closeAlertModal}
      />
    </div>
  );
};

export default LiveTracking;
