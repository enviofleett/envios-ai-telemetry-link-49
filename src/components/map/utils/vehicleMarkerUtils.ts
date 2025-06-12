
import type { VehicleData } from '@/types/vehicle';

export const createMarkerElement = (
  vehicle: VehicleData, 
  selectedVehicle: VehicleData | null, 
  onVehicleSelect?: (vehicle: VehicleData) => void
): HTMLElement => {
  const element = document.createElement('div');
  element.className = 'vehicle-marker';
  
  const isSelected = selectedVehicle?.deviceId === vehicle.deviceId;
  const status = getVehicleStatus(vehicle);
  const color = getStatusColor(status);
  
  element.innerHTML = `
    <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transform transition-transform hover:scale-110 ${isSelected ? 'ring-2 ring-blue-500' : ''}" 
         style="background-color: ${color}">
      <div class="w-full h-full rounded-full flex items-center justify-center">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  `;
  
  if (onVehicleSelect) {
    element.addEventListener('click', () => onVehicleSelect(vehicle));
  }
  
  return element;
};

const getVehicleStatus = (vehicle: VehicleData) => {
  if (!vehicle.lastPosition?.updatetime) return 'offline';
  
  const lastUpdate = new Date(vehicle.lastPosition.updatetime);
  const now = new Date();
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
  
  if (minutesSinceUpdate > 5) return 'offline';
  if (vehicle.lastPosition.speed > 0) return 'moving';
  return 'online';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'moving': return '#3b82f6'; // Blue
    case 'online': return '#22c55e'; // Green
    default: return '#ef4444'; // Red
  }
};
