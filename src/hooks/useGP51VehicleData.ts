
import { useState, useEffect, useCallback } from 'react';
import { gp51DataService, type VehiclePosition } from '@/services/gp51/GP51DataService';
import { useGP51Auth } from '@/hooks/useGP51Auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedVehicle extends VehiclePosition {
  id?: string;
  envio_user_id?: string;
  vehicle_name?: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  vin?: string;
  color?: string;
  fuel_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleDataMetrics {
  total: number;
  online: number;
  offline: number;
  moving: number;
  idle: number;
  lastUpdateTime: Date;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

interface UseGP51VehicleDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includeOffline?: boolean;
}

export const useGP51VehicleData = (options: UseGP51VehicleDataOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    includeOffline = true
  } = options;

  const { isAuthenticated, error: authError } = useGP51Auth();
  const { toast } = useToast();

  const [vehicles, setVehicles] = useState<EnhancedVehicle[]>([]);
  const [metrics, setMetrics] = useState<VehicleDataMetrics>({
    total: 0,
    online: 0,
    offline: 0,
    moving: 0,
    idle: 0,
    lastUpdateTime: new Date(),
    syncStatus: 'pending'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const calculateMetrics = useCallback((vehicleList: EnhancedVehicle[]): VehicleDataMetrics => {
    const total = vehicleList.length;
    const online = vehicleList.filter(v => v.isOnline).length;
    const offline = total - online;
    const moving = vehicleList.filter(v => v.isMoving).length;
    const idle = online - moving;

    return {
      total,
      online,
      offline,
      moving,
      idle,
      lastUpdateTime: new Date(),
      syncStatus: 'success'
    };
  }, []);

  const syncVehicleData = useCallback(async (showToast = false) => {
    if (!isAuthenticated) {
      console.log('🚗 Skipping vehicle sync - not authenticated with GP51');
      setMetrics(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: 'Not authenticated with GP51'
      }));
      return;
    }

    const wasLoading = vehicles.length === 0;
    if (wasLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      console.log('🚗 Starting vehicle data sync from GP51...');

      // Step 1: Get vehicle metadata from Supabase
      const { data: supabaseVehicles, error: supabaseError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(`Supabase error: ${supabaseError.message}`);
      }

      // Step 2: Get live vehicle data from GP51
      const gp51Vehicles = await gp51DataService.getDeviceList();
      
      // Step 3: If we have GP51 vehicles, get their positions
      let vehiclePositions: Map<string, VehiclePosition> = new Map();
      if (gp51Vehicles.length > 0) {
        const deviceIds = gp51Vehicles.map(v => v.deviceId);
        vehiclePositions = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);
      }

      // Step 4: Merge Supabase metadata with GP51 live data
      const enhancedVehicles: EnhancedVehicle[] = [];

      // First, add vehicles that exist in both systems
      if (supabaseVehicles) {
        supabaseVehicles.forEach(supabaseVehicle => {
          const gp51Position = vehiclePositions.get(supabaseVehicle.device_id) || 
                              gp51Vehicles.find(v => v.deviceId === supabaseVehicle.device_id);
          
          if (gp51Position) {
            enhancedVehicles.push({
              ...gp51Position,
              id: supabaseVehicle.id,
              envio_user_id: supabaseVehicle.envio_user_id,
              vehicle_name: supabaseVehicle.vehicle_name,
              deviceName: supabaseVehicle.vehicle_name || gp51Position.deviceName,
              make: supabaseVehicle.make,
              model: supabaseVehicle.model,
              year: supabaseVehicle.year,
              license_plate: supabaseVehicle.license_plate,
              vin: supabaseVehicle.vin,
              color: supabaseVehicle.color,
              fuel_type: supabaseVehicle.fuel_type,
              created_at: supabaseVehicle.created_at,
              updated_at: supabaseVehicle.updated_at
            });
          } else if (includeOffline) {
            // Add offline vehicle with default position data
            enhancedVehicles.push({
              deviceId: supabaseVehicle.device_id,
              deviceName: supabaseVehicle.vehicle_name,
              latitude: 0,
              longitude: 0,
              speed: 0,
              course: 0,
              timestamp: new Date(supabaseVehicle.updated_at || supabaseVehicle.created_at),
              status: 'offline',
              statusText: 'No signal',
              isOnline: false,
              isMoving: false,
              id: supabaseVehicle.id,
              envio_user_id: supabaseVehicle.envio_user_id,
              vehicle_name: supabaseVehicle.vehicle_name,
              make: supabaseVehicle.make,
              model: supabaseVehicle.model,
              year: supabaseVehicle.year,
              license_plate: supabaseVehicle.license_plate,
              vin: supabaseVehicle.vin,
              color: supabaseVehicle.color,
              fuel_type: supabaseVehicle.fuel_type,
              created_at: supabaseVehicle.created_at,
              updated_at: supabaseVehicle.updated_at
            });
          }
        });
      }

      // Add GP51-only vehicles (not in Supabase)
      gp51Vehicles.forEach(gp51Vehicle => {
        const existsInSupabase = supabaseVehicles?.some(sv => sv.device_id === gp51Vehicle.deviceId);
        if (!existsInSupabase) {
          const position = vehiclePositions.get(gp51Vehicle.deviceId) || gp51Vehicle;
          enhancedVehicles.push({
            ...position,
            vehicle_name: position.deviceName
          });
        }
      });

      setVehicles(enhancedVehicles);
      setMetrics(calculateMetrics(enhancedVehicles));

      console.log(`✅ Vehicle sync completed: ${enhancedVehicles.length} vehicles`);
      
      if (showToast) {
        toast({
          title: "Vehicle Data Updated",
          description: `Synchronized ${enhancedVehicles.length} vehicles from GP51`
        });
      }

    } catch (error) {
      console.error('❌ Vehicle sync failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setMetrics(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage
      }));

      if (showToast) {
        toast({
          title: "Sync Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, includeOffline, calculateMetrics, toast, vehicles.length]);

  // Initial sync and periodic refresh
  useEffect(() => {
    if (isAuthenticated) {
      syncVehicleData();
    } else if (authError) {
      setIsLoading(false);
      setMetrics(prev => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: authError
      }));
    }
  }, [isAuthenticated, authError]);

  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(() => {
      syncVehicleData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated, refreshInterval, syncVehicleData]);

  const forceRefresh = useCallback(async () => {
    await syncVehicleData(true);
  }, [syncVehicleData]);

  const getVehicleById = useCallback((deviceId: string) => {
    return vehicles.find(v => v.deviceId === deviceId);
  }, [vehicles]);

  const getOnlineVehicles = useCallback(() => {
    return vehicles.filter(v => v.isOnline);
  }, [vehicles]);

  const getOfflineVehicles = useCallback(() => {
    return vehicles.filter(v => !v.isOnline);
  }, [vehicles]);

  const getMovingVehicles = useCallback(() => {
    return vehicles.filter(v => v.isMoving);
  }, [vehicles]);

  const getIdleVehicles = useCallback(() => {
    return vehicles.filter(v => v.isOnline && !v.isMoving);
  }, [vehicles]);

  return {
    vehicles,
    metrics,
    isLoading,
    isRefreshing,
    forceRefresh,
    getVehicleById,
    getOnlineVehicles,
    getOfflineVehicles,
    getMovingVehicles,
    getIdleVehicles
  };
};
