
// Stub implementation for vehicle position sync service
export class VehiclePositionSyncService {
  startPeriodicSync() {
    console.log('Vehicle position sync not implemented');
  }

  stopPeriodicSync() {
    console.log('Stop vehicle position sync not implemented');
  }

  async forceSync() {
    console.log('Force sync not implemented');
  }

  subscribeToStatus(callback: (status: string) => void) {
    // Stub implementation
    return () => {};
  }

  getSyncProgress() {
    return {
      totalVehicles: 0,
      processedVehicles: 0,
      percentage: 0,
      currentVehicle: null,
      errors: []
    };
  }

  getMetrics() {
    return {
      syncCount: 0,
      errorCount: 0,
      averageLatency: 0,
      lastSyncTime: null
    };
  }

  destroy() {
    console.log('Vehicle position sync service destroyed');
  }
}

export const vehiclePositionSyncService = new VehiclePositionSyncService();
