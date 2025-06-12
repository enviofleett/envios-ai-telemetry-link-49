
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
  // Additional properties for compatibility
  deviceid?: string; // Alias for deviceId
  devicename?: string; // Alias for deviceName
  plateNumber?: string; // Alias for license_plate
  is_active?: boolean;
  lastPosition?: {
    lat: number;
    lng: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
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
        .select(`
          id,
          device_id,
          device_name,
          envio_user_id,
          is_active,
          created_at,
          updated_at
        `)
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
            const enhancedVehicle: EnhancedVehicle = {
              ...gp51Position,
              id: supabaseVehicle.id,
              envio_user_id: supabaseVehicle.envio_user_id,
              vehicle_name: supabaseVehicle.device_name,
              deviceName: supabaseVehicle.device_name || gp51Position.deviceName,
              created_at: supabaseVehicle.created_at,
              updated_at: supabaseVehicle.updated_at,
              // Add compatibility aliases
              deviceid: gp51Position.deviceId,
              devicename: supabaseVehicle.device_name || gp51Position.deviceName,
              plateNumber: supabaseVehicle.device_name,
              is_active: supabaseVehicle.is_active,
              lastPosition: {
                lat: gp51Position.latitude,
                lng: gp51Position.longitude,
                speed: gp51Position.speed,
                course: gp51Position.course,
                updatetime: gp51Position.timestamp.toISOString(),
                statusText: gp51Position.statusText
              }
            };
            enhancedVehicles.push(enhancedVehicle);
          } else if (includeOffline) {
            // Add offline vehicle with default position data
            const offlineVehicle: EnhancedVehicle = {
              deviceId: supabaseVehicle.device_id,
              deviceName: supabaseVehicle.device_name,
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
              vehicle_name: supabaseVehicle.device_name,
              created_at: supabaseVehicle.created_at,
              updated_at: supabaseVehicle.updated_at,
              // Add compatibility aliases
              deviceid: supabaseVehicle.device_id,
              devicename: supabaseVehicle.device_name,
              plateNumber: supabaseVehicle.device_name,
              is_active: supabaseVehicle.is_active,
              lastPosition: {
                lat: 0,
                lng: 0,
                speed: 0,
                course: 0,
                updatetime: new Date(supabaseVehicle.updated_at || supabaseVehicle.created_at).toISOString(),
                statusText: 'No signal'
              }
            };
            enhancedVehicles.push(offlineVehicle);
          }
        });
      }

      // Add GP51-only vehicles (not in Supabase)
      gp51Vehicles.forEach(gp51Vehicle => {
        const existsInSupabase = supabaseVehicles?.some(sv => sv.device_id === gp51Vehicle.deviceId);
        if (!existsInSupabase) {
          const position = vehiclePositions.get(gp51Vehicle.deviceId) || gp51Vehicle;
          const enhancedVehicle: EnhancedVehicle = {
            ...position,
            vehicle_name: position.deviceName,
            // Add compatibility aliases
            deviceid: position.deviceId,
            devicename: position.deviceName,
            plateNumber: position.deviceName,
            is_active: true,
            lastPosition: {
              lat: position.latitude,
              lng: position.longitude,
              speed: position.speed,
              course: position.course,
              updatetime: position.timestamp.toISOString(),
              statusText: position.statusText
            }
          };
          enhancedVehicles.push(enhancedVehicle);
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
