
// Enhanced vehicle interfaces for comprehensive tracking
export interface EnhancedVehicle {
  id: string;
  plateNumber: string;
  model: string;
  status: "active" | "idle" | "maintenance" | "offline";
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  speed: number;
  fuel: number;
  driver: string;
  lastUpdate: string;
  vin: string;
  engineHours: number;
  mileage: number;
  fuelType: "Diesel" | "Petrol" | "Electric" | "Hybrid";
  engineSize: string;
  year: number;
}

export interface FuelRecord {
  date: string;
  consumption: number;
  efficiency: number;
  cost: number;
  distance: number;
  performance: "Excellent" | "Good" | "Poor";
}

export interface EngineRecord {
  date: string;
  engineHours: number;
  idleTime: number;
  productiveHours: number;
  utilization: number;
  performance: "Excellent" | "Good" | "Poor";
}

export interface MileageRecord {
  date: string;
  distance: number;
  trips: number;
  avgTripDistance: number;
  estimatedFuel: number;
  activity: "High" | "Medium" | "Low";
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}
