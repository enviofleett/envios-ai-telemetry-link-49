
// Stub implementation for vehicle position sync service
export class VehiclePositionSyncService {
  startPeriodicSync() {
    console.log('Vehicle position sync not implemented');
  }

  async forceSync() {
    console.log('Force sync not implemented');
  }

  subscribeToStatus(callback: (status: string) => void) {
    // Stub implementation
    return () => {};
  }

  destroy() {
    console.log('Vehicle position sync service destroyed');
  }
}

export const vehiclePositionSyncService = new VehiclePositionSyncService();
