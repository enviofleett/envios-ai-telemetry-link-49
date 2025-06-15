import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FleetMetrics {
  totalVehicles: number;
  activeVehicles: number;
  onlineVehicles: number;
  alertVehicles: number;
}

interface InsightData {
  fuelEfficiencyTrend: Array<{ date: string; efficiency: number }>;
  maintenanceAlerts: Array<{ vehicleId: string; type: string; dueIn: string }>;
  driverBehavior: {
    fleetScore: number;
    topIssues: Array<{ issue: string; percentage: number }>;
  };
  anomalies: Array<{ vehicleId: string; description: string; severity: string }>;
}

interface Alert {
  id: string;
  deviceName: string;
  deviceId: string;
  alarmType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface VehiclePosition {
  updatetime?: string;
  lat?: number;
  lon?: number;
  [key: string]: any;
}

export const useDashboardData = () => {
  const [metrics, setMetrics] = useState<FleetMetrics>({
    totalVehicles: 0,
    activeVehicles: 0,
    onlineVehicles: 0,
    alertVehicles: 0
  });

  const [insights, setInsights] = useState<InsightData>({
    fuelEfficiencyTrend: [],
    maintenanceAlerts: [],
    driverBehavior: { fleetScore: 0, topIssues: [] },
    anomalies: []
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch vehicles data from Supabase
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');

      if (vehiclesError) throw vehiclesError;
      
      const dbVehicles = vehicles || [];

      // Calculate metrics from vehicles data
      const totalVehicles = dbVehicles.length || 0;
      // 'is_active' is not in the DB anymore. We need a new way to determine this.
      // For now, let's assume all are active.
      const activeVehicles = dbVehicles.length || 0;
      
      // Check online status based on last position update time (last 30 minutes)
      // We don't have this data directly. This logic needs to be placeholder.
      const onlineVehicles = 0; // Placeholder

      // Check for alert vehicles (simplified - based on status)
      // 'status' is not in the DB. Placeholder.
      const alertVehicles = 0; // Placeholder

      setMetrics({
        totalVehicles,
        activeVehicles,
        onlineVehicles,
        alertVehicles
      });

      // Generate mock insights data (to be replaced with real AI insights)
      const mockInsights: InsightData = {
        fuelEfficiencyTrend: [
          { date: '2024-01-01', efficiency: 8.5 },
          { date: '2024-01-02', efficiency: 8.2 },
          { date: '2024-01-03', efficiency: 8.7 },
          { date: '2024-01-04', efficiency: 8.4 },
          { date: '2024-01-05', efficiency: 8.9 },
        ],
        maintenanceAlerts: [
          { vehicleId: 'VH001', type: 'Oil Change', dueIn: '500km' },
          { vehicleId: 'VH002', type: 'Brake Service', dueIn: '1200km' },
        ],
        driverBehavior: {
          fleetScore: 85,
          topIssues: [
            { issue: 'Excessive Idling', percentage: 15 },
            { issue: 'Hard Braking', percentage: 8 },
          ]
        },
        anomalies: [
          { vehicleId: 'VH003', description: 'Unusual route deviation', severity: 'medium' },
          { vehicleId: 'VH004', description: 'After-hours movement', severity: 'low' },
        ]
      };

      setInsights(mockInsights);

      // Generate mock alerts (to be replaced with real GP51 alarm data)
      const mockAlerts: Alert[] = dbVehicles?.slice(0, 5).map((vehicle, index) => ({
        id: `alert-${index}`,
        deviceName: vehicle.name, // Use 'name' from DB
        deviceId: vehicle.gp51_device_id, // Use 'gp51_device_id' from DB
        alarmType: ['Speed Alert', 'Geofence', 'Engine Alert', 'Fuel Alert'][index % 4],
        description: ['Vehicle exceeding speed limit', 'Left authorized area', 'Engine temperature high', 'Fuel level low'][index % 4],
        severity: (['low', 'medium', 'high', 'critical'] as const)[index % 4],
        timestamp: new Date(Date.now() - index * 3600000).toISOString()
      })) || [];

      setAlerts(mockAlerts);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    insights,
    alerts,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
};
