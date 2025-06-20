
export interface ReportQuery {
  vehicleIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  reportType: string;
  status?: string;
  geofenceIds?: string[];
  alertTypes?: string[];
  limit?: number;
}

export interface VehicleUsageStats {
  totalMileage: number;
  fuelEfficiency: number;
  averageSpeed: number;
  utilizationRate: number;
  maintenanceScore: number;
  totalTrips: number;
  idleTime: number;
  totalFuelConsumed: number;
}

export interface ReportFilters {
  dateFrom: Date;
  dateTo: Date;
  vehicleIds: string[];
  reportType: string;
}

export interface VehicleItem {
  id: string;
  name: string;
  device_id: string;
}
