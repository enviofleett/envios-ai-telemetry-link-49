// Mock Reports API Service
import { 
  type VehicleData 
} from '@/services/unifiedVehicleData';
import type { VehicleUsageStats } from '@/types/reports';

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

const generateTripReports = async (query: ReportQuery): Promise<any[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockData = [...Array(query.limit || 10)].map((_, index) => ({
    id: `trip-${index}`,
    vehicleId: query.vehicleIds?.[0] || `vehicle-${index}`,
    vehicleName: `Vehicle ${index}`,
    startTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    endTime: new Date().toISOString(),
    duration: Math.floor(Math.random() * 3600), // seconds
    distance: Math.floor(Math.random() * 200000), // meters
    averageSpeed: Math.floor(Math.random() * 80), // km/h
    maxSpeed: Math.floor(Math.random() * 120), // km/h
    fuelConsumed: (Math.random() * 50).toFixed(2),
    idleTime: Math.floor(Math.random() * 60),
    status: Math.random() > 0.8 ? 'alert' : 'completed',
  }));

  return mockData;
};

const generateGeofenceReports = async (query: ReportQuery): Promise<any[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockData = [...Array(query.limit || 10)].map((_, index) => ({
    id: `geofence-${index}`,
    vehicleId: query.vehicleIds?.[0] || `vehicle-${index}`,
    vehicleName: `Vehicle ${index}`,
    geofenceName: `Geofence ${index}`,
    eventType: Math.random() > 0.5 ? 'enter' : 'exit',
    eventTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    duration: Math.floor(Math.random() * 3600), // seconds
    location: { lat: 34.0522 + Math.random() * 0.1, lng: -118.2437 + Math.random() * 0.1 },
    violationType: Math.random() > 0.7 ? 'unauthorized' : 'authorized',
  }));

  return mockData;
};

const generateMaintenanceReports = async (query: ReportQuery): Promise<any[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockData = [...Array(query.limit || 10)].map((_, index) => ({
    id: `maintenance-${index}`,
    vehicleId: query.vehicleIds?.[0] || `vehicle-${index}`,
    vehicleName: `Vehicle ${index}`,
    maintenanceType: `Type ${index}`,
    scheduledDate: new Date(Date.now() + Math.random() * 86400000).toISOString(),
    completedDate: new Date().toISOString(),
    cost: (Math.random() * 500).toFixed(2),
    serviceProvider: `Provider ${index}`,
    nextServiceDue: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: ['scheduled', 'completed', 'overdue'][Math.floor(Math.random() * 3)],
  }));

  return mockData;
};

const generateAlertReports = async (query: ReportQuery): Promise<any[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockData = [...Array(query.limit || 10)].map((_, index) => ({
    id: `alert-${index}`,
    vehicleId: query.vehicleIds?.[0] || `vehicle-${index}`,
    vehicleName: `Vehicle ${index}`,
    alertType: `Type ${index}`,
    alertTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
    description: `Description ${index}`,
    location: { lat: 34.0522 + Math.random() * 0.1, lng: -118.2437 + Math.random() * 0.1 },
    resolvedBy: `User ${index}`,
    resolvedAt: new Date().toISOString(),
    status: ['active', 'acknowledged', 'resolved'][Math.floor(Math.random() * 3)],
  }));

  return mockData;
};

const getVehicleUsageStats = async (vehicleIds?: string[]): Promise<VehicleUsageStats[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockData = (vehicleIds || ['vehicle-1', 'vehicle-2']).map((vehicleId, index) => ({
    totalMileage: Math.floor(Math.random() * 10000 + 5000), // km
    fuelEfficiency: Number((Math.random() * 5 + 8).toFixed(1)), // km/L
    averageSpeed: Math.floor(Math.random() * 30 + 40), // km/h
    utilizationRate: Number((Math.random() * 0.4 + 0.5).toFixed(2)), // 50-90%
    maintenanceScore: Math.floor(Math.random() * 30 + 70), // 70-100
    totalTrips: Math.floor(Math.random() * 100 + 50),
    idleTime: Math.floor(Math.random() * 50 + 10), // hours
    totalFuelConsumed: Number((Math.random() * 500 + 200).toFixed(1)), // L
  }));

  return mockData;
};

const exportReportData = async (reportType: string, reportData: any[]): Promise<string> => {
  // Simulate data transformation and CSV generation
  await new Promise(resolve => setTimeout(resolve, 500));

  const headers = Object.keys(reportData[0] || {}).join(',');
  const rows = reportData.map(item => Object.values(item).join(',')).join('\n');
  return `${headers}\n${rows}`;
};

export const reportsApi = {
  generateTripReports,
  generateGeofenceReports,
  generateMaintenanceReports,
  generateAlertReports,
  getVehicleUsageStats,
  exportReportData,
};
