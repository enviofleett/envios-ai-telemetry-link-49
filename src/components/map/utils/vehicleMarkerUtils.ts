
import type { Vehicle } from '@/services/unifiedVehicleData';
import { getVehicleStatus, getStatusColor } from './vehicleStatusUtils';

export const createMarkerElement = (
  vehicle: Vehicle, 
  selectedVehicle: Vehicle | null, 
  onVehicleSelect?: (vehicle: Vehicle) => void
) => {
  const status = getVehicleStatus(vehicle);
  const color = getStatusColor(status);
  const isSelected = selectedVehicle?.deviceid === vehicle.deviceid;
  const plateNumber = vehicle.plateNumber || vehicle.devicename;
  
  const el = document.createElement('div');
  el.className = 'vehicle-marker';
  
  if (isSelected) {
    // Special selected vehicle marker with plate number
    el.style.cssText = `
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    // Main marker container
    const markerContainer = document.createElement('div');
    markerContainer.style.cssText = `
      background-color: ${color};
      width: 40px;
      height: 25px;
      border-radius: 6px;
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      position: relative;
      animation: pulse 2s infinite;
    `;
    
    // Plate number display
    const plateDisplay = document.createElement('div');
    plateDisplay.style.cssText = `
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      white-space: nowrap;
      z-index: 1000;
    `;
    plateDisplay.textContent = plateNumber;
    
    // Add CSS animation for pulsing effect
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 0 0 ${color}40; }
        70% { box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 0 10px transparent; }
        100% { box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 0 0 transparent; }
      }
    `;
    document.head.appendChild(style);
    
    el.appendChild(markerContainer);
    el.appendChild(plateDisplay);
  } else {
    // Regular circular marker
    el.style.cssText = `
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
    `;
    
    // Add tooltip for non-selected vehicles
    const tooltip = document.createElement('div');
    tooltip.className = 'vehicle-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      background: black;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
      z-index: 1000;
    `;
    tooltip.textContent = `${plateNumber} - ${status.toUpperCase()}`;
    el.appendChild(tooltip);
    
    // Show/hide tooltip on hover
    el.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
    });
    
    el.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  }
  
  // Click handler
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onVehicleSelect?.(vehicle);
  });
  
  return el;
};
