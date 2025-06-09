
import type { Vehicle } from '@/services/unifiedVehicleData';
import { getVehicleStatus, getStatusColor } from './vehicleStatusUtils';

// Create unique animation styles to avoid conflicts
let animationStylesInjected = false;

const injectAnimationStyles = () => {
  if (animationStylesInjected) return;
  
  const styleId = 'vehicle-marker-animations';
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes vehicle-pulse {
      0% { 
        box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 0 currentColor;
        transform: scale(1);
      }
      50% { 
        box-shadow: 0 6px 20px rgba(0,0,0,0.6), 0 0 0 8px transparent;
        transform: scale(1.05);
      }
      100% { 
        box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 0 transparent;
        transform: scale(1);
      }
    }
    
    @keyframes vehicle-entrance {
      0% {
        transform: scale(0.8);
        opacity: 0;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    @keyframes vehicle-glow {
      0%, 100% { 
        filter: drop-shadow(0 0 4px currentColor);
      }
      50% { 
        filter: drop-shadow(0 0 12px currentColor);
      }
    }
    
    .vehicle-marker-selected {
      animation: vehicle-pulse 2.5s infinite ease-in-out, vehicle-entrance 0.4s ease-out;
      position: relative;
    }
    
    .vehicle-marker-selected::before {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: inherit;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: vehicle-glow 3s infinite ease-in-out;
      z-index: -1;
    }
    
    .vehicle-marker-hover {
      transition: all 0.2s ease-out;
    }
    
    .vehicle-marker-hover:hover {
      transform: scale(1.1);
      filter: brightness(1.1);
    }
    
    .vehicle-plate-label {
      background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7));
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.2);
      animation: vehicle-entrance 0.3s ease-out 0.1s both;
    }
  `;
  document.head.appendChild(style);
  animationStylesInjected = true;
};

export const createMarkerElement = (
  vehicle: Vehicle, 
  selectedVehicle: Vehicle | null, 
  onVehicleSelect?: (vehicle: Vehicle) => void
) => {
  // Inject animation styles
  injectAnimationStyles();
  
  const status = getVehicleStatus(vehicle);
  const color = getStatusColor(status);
  const isSelected = selectedVehicle?.deviceid === vehicle.deviceid;
  const plateNumber = vehicle.plateNumber || vehicle.devicename;
  
  const el = document.createElement('div');
  el.className = 'vehicle-marker';
  
  if (isSelected) {
    // Enhanced selected vehicle marker
    el.style.cssText = `
      position: relative;
      cursor: pointer;
      z-index: 1000;
    `;
    
    // Main marker container with enhanced styling
    const markerContainer = document.createElement('div');
    markerContainer.className = 'vehicle-marker-selected';
    markerContainer.style.cssText = `
      background: linear-gradient(135deg, ${color}, ${color}dd);
      width: 45px;
      height: 30px;
      border-radius: 8px;
      border: 3px solid white;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      position: relative;
      color: ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    `;
    
    // Add vehicle icon inside marker
    const vehicleIcon = document.createElement('div');
    vehicleIcon.style.cssText = `
      width: 16px;
      height: 12px;
      background: white;
      border-radius: 2px;
      position: relative;
      opacity: 0.9;
    `;
    vehicleIcon.innerHTML = `
      <div style="
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        background: ${color};
        border-radius: 1px;
      "></div>
    `;
    markerContainer.appendChild(vehicleIcon);
    
    // Enhanced plate number display
    const plateDisplay = document.createElement('div');
    plateDisplay.className = 'vehicle-plate-label';
    plateDisplay.style.cssText = `
      position: absolute;
      bottom: -32px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      z-index: 1001;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      min-width: 45px;
      text-align: center;
    `;
    plateDisplay.textContent = plateNumber;
    
    // Add status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.style.cssText = `
      position: absolute;
      top: -6px;
      right: -6px;
      width: 12px;
      height: 12px;
      background: ${status === 'moving' ? '#3b82f6' : status === 'online' ? '#22c55e' : '#ef4444'};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      z-index: 1002;
    `;
    
    el.appendChild(markerContainer);
    el.appendChild(plateDisplay);
    el.appendChild(statusIndicator);
  } else {
    // Enhanced regular circular marker
    el.className = 'vehicle-marker vehicle-marker-hover';
    el.style.cssText = `
      background: linear-gradient(135deg, ${color}, ${color}dd);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease-out;
    `;
    
    // Add mini status indicator for non-selected vehicles
    const miniStatusDot = document.createElement('div');
    miniStatusDot.style.cssText = `
      position: absolute;
      top: -2px;
      right: -2px;
      width: 6px;
      height: 6px;
      background: ${status === 'moving' ? '#3b82f6' : status === 'online' ? '#22c55e' : '#ef4444'};
      border: 1px solid white;
      border-radius: 50%;
      z-index: 100;
    `;
    el.appendChild(miniStatusDot);
    
    // Enhanced tooltip for non-selected vehicles
    const tooltip = document.createElement('div');
    tooltip.className = 'vehicle-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7));
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease-out;
      z-index: 1000;
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.2);
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    `;
    tooltip.textContent = `${plateNumber} - ${status.toUpperCase()}`;
    el.appendChild(tooltip);
    
    // Enhanced hover effects
    el.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
      el.style.transform = 'scale(1.15)';
      el.style.zIndex = '999';
    });
    
    el.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      el.style.transform = 'scale(1)';
      el.style.zIndex = '1';
    });
  }
  
  // Enhanced click handler with visual feedback
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Add click animation
    const clickEffect = document.createElement('div');
    clickEffect.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255,255,255,0.6);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 999;
    `;
    el.appendChild(clickEffect);
    
    // Animate click effect
    clickEffect.animate([
      { width: '0px', height: '0px', opacity: 1 },
      { width: '60px', height: '60px', opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-out'
    }).onfinish = () => {
      clickEffect.remove();
    };
    
    onVehicleSelect?.(vehicle);
  });
  
  return el;
};
