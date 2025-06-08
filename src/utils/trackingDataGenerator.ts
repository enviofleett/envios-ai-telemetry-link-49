
import { format } from 'date-fns';
import type { EnhancedVehicle, FuelRecord, EngineRecord, MileageRecord } from '@/types/enhancedVehicle';

export const generateFuelData = (vehicle: EnhancedVehicle, days: number): FuelRecord[] => {
  const baseConsumption = vehicle.fuelType === "Diesel" ? 8.5 : vehicle.fuelType === "Petrol" ? 10.2 : 0;
  const engineFactor = Number.parseFloat(vehicle.engineSize) * 1.2;
  const ageFactor = (2024 - vehicle.year) * 0.1 + 1;

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    const consumption = Math.round((baseConsumption + Math.random() * 2 - 1) * engineFactor * ageFactor * 10) / 10;
    const efficiency = Math.round((12 + Math.random() * 4 - 2) * 10) / 10;
    const distance = Math.round((120 + Math.random() * 80 - 40) * 10) / 10;
    const cost = Math.round(consumption * 1.45 * 100) / 100;

    return {
      date: format(date, "yyyy-MM-dd"),
      consumption,
      efficiency,
      cost,
      distance,
      performance: efficiency > 14 ? "Excellent" : efficiency > 11 ? "Good" : "Poor",
    };
  });
};

export const generateEngineData = (vehicle: EnhancedVehicle, days: number): EngineRecord[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    const engineHours = Math.round((8 + Math.random() * 4 - 2) * 10) / 10;
    const idleTime = Math.round((1.5 + Math.random() * 1 - 0.5) * 10) / 10;
    const productiveHours = Math.round((engineHours - idleTime) * 10) / 10;
    const utilization = Math.round((productiveHours / engineHours) * 100 * 10) / 10;

    return {
      date: format(date, "yyyy-MM-dd"),
      engineHours,
      idleTime,
      productiveHours,
      utilization,
      performance: utilization > 85 ? "Excellent" : utilization > 70 ? "Good" : "Poor",
    };
  });
};

export const generateMileageData = (vehicle: EnhancedVehicle, days: number): MileageRecord[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    const distance = Math.round((120 + Math.random() * 80 - 40) * 10) / 10;
    const trips = Math.floor(3 + Math.random() * 4);
    const avgTripDistance = Math.round((distance / trips) * 10) / 10;
    const estimatedFuel = Math.round((distance / 12) * 10) / 10;

    return {
      date: format(date, "yyyy-MM-dd"),
      distance,
      trips,
      avgTripDistance,
      estimatedFuel,
      activity: distance > 180 ? "High" : distance > 100 ? "Medium" : "Low",
    };
  });
};

export const convertToEnhancedVehicle = (vehicle: any): EnhancedVehicle => {
  // Convert GPS51 vehicle data to enhanced vehicle format
  const baseSpeed = vehicle.lastPosition?.speed || 0;
  const randomFuel = Math.floor(Math.random() * 100) + 1;
  const estimatedMileage = Math.floor(Math.random() * 100000) + 10000;
  const estimatedEngineHours = Math.floor(estimatedMileage / 25);
  
  return {
    id: vehicle.deviceid || vehicle.id,
    plateNumber: vehicle.devicename || `VEH-${vehicle.deviceid}`,
    model: getRandomVehicleModel(),
    status: getVehicleStatus(vehicle),
    location: {
      lat: vehicle.lastPosition?.lat || 0,
      lng: vehicle.lastPosition?.lon || 0,
      address: vehicle.lastPosition?.statusText || "Unknown Location"
    },
    speed: baseSpeed,
    fuel: randomFuel,
    driver: getRandomDriver(),
    lastUpdate: vehicle.lastPosition?.updatetime 
      ? new Date(vehicle.lastPosition.updatetime).toLocaleString()
      : "Unknown",
    vin: generateVIN(),
    engineHours: estimatedEngineHours,
    mileage: estimatedMileage,
    fuelType: getRandomFuelType(),
    engineSize: getRandomEngineSize(),
    year: Math.floor(Math.random() * 8) + 2017, // 2017-2024
  };
};

const getVehicleStatus = (vehicle: any): "active" | "idle" | "maintenance" | "offline" => {
  if (!vehicle.lastPosition?.updatetime) return "offline";
  
  const lastUpdate = new Date(vehicle.lastPosition.updatetime);
  const now = new Date();
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
  
  if (minutesSinceUpdate > 60) return "offline";
  if (vehicle.lastPosition.speed > 5) return "active";
  if (Math.random() > 0.9) return "maintenance";
  return "idle";
};

const getRandomVehicleModel = (): string => {
  const models = [
    "Ford Transit 2022",
    "Mercedes Sprinter 2023", 
    "Iveco Daily 2021",
    "Volkswagen Crafter 2022",
    "Renault Master 2023",
    "Peugeot Boxer 2021"
  ];
  return models[Math.floor(Math.random() * models.length)];
};

const getRandomDriver = (): string => {
  const drivers = [
    "John Smith", "Sarah Johnson", "Mike Wilson", "Emma Davis", 
    "Chris Brown", "Lisa Anderson", "David Taylor", "Maria Garcia"
  ];
  return drivers[Math.floor(Math.random() * drivers.length)];
};

const getRandomFuelType = (): "Diesel" | "Petrol" | "Electric" | "Hybrid" => {
  const types: ("Diesel" | "Petrol" | "Electric" | "Hybrid")[] = ["Diesel", "Petrol", "Electric", "Hybrid"];
  return types[Math.floor(Math.random() * types.length)];
};

const getRandomEngineSize = (): string => {
  const sizes = ["1.6L", "2.0L", "2.1L", "2.3L", "2.8L", "3.0L"];
  return sizes[Math.floor(Math.random() * sizes.length)];
};

const generateVIN = (): string => {
  const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
  let vin = "";
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
};
