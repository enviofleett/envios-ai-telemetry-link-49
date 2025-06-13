
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { VehicleData } from '@/types/vehicle';
import { createMarkerElement } from '../utils/vehicleMarkerUtils';

interface VehicleMarker {
  vehicle: VehicleData;
  marker: maplibregl.Marker;
  element: HTMLElement;
}

export const useMapMarkers = (
  map: maplibregl.Map | null,
  isMapLoaded: boolean,
  vehicles: VehicleData[],
  selectedVehicle: VehicleData | null,
  onVehicleSelect?: (vehicle: VehicleData) => void
) => {
  const markersRef = useRef<VehicleMarker[]>([]);

  useEffect(() => {
    if (!map || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    // Filter vehicles with valid positions
    const validVehicles = vehicles.filter(v => 
      v.last_position?.lat && 
      v.last_position?.lng &&
      !isNaN(v.last_position.lat) &&
      !isNaN(v.last_position.lng)
    );

    if (validVehicles.length === 0) {
      // Center on a default location if no vehicles
      map.setCenter([0, 0]);
      map.setZoom(2);
      return;
    }

    // Add new markers
    const newMarkers: VehicleMarker[] = validVehicles.map(vehicle => {
      const element = createMarkerElement(vehicle, selectedVehicle, onVehicleSelect);
      const marker = new maplibregl.Marker(element)
        .setLngLat([vehicle.last_position!.lng, vehicle.last_position!.lat])
        .addTo(map);

      return { vehicle, marker, element };
    });

    markersRef.current = newMarkers;

    // Fit bounds to show all vehicles (only if no specific vehicle is selected)
    if (!selectedVehicle) {
      if (validVehicles.length === 1) {
        const vehicle = validVehicles[0];
        map.setCenter([vehicle.last_position!.lng, vehicle.last_position!.lat]);
        map.setZoom(16);
      } else if (validVehicles.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        validVehicles.forEach(vehicle => {
          bounds.extend([vehicle.last_position!.lng, vehicle.last_position!.lat]);
        });
        map.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [map, isMapLoaded, vehicles, selectedVehicle, onVehicleSelect]);

  return markersRef;
};
