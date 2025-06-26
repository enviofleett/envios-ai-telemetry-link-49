
import { useState, useEffect, useCallback, useRef } from 'react';
import type { VehicleData } from '@/services/EnhancedVehicleDataService';
import { enhancedVehicleDataService } from '@/services/EnhancedVehicleDataService';
import { useToast } from '@/hooks/use-toast';

export const useOptimizedVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const isMountedRef = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  const debouncedUpdate = useCallback((newVehicles: VehicleData[]) => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    const delay = timeSinceLastUpdate < 1000 ? 500 : 0;
    
    updateTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setVehicles(newVehicles);
        lastUpdateRef.current = now;
      }
    }, delay);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await enhancedVehicleDataService.getVehicleData();
      debouncedUpdate(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicle data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedUpdate, toast]);

  useEffect(() => {
    isMountedRef.current = true;
    
    const subscriberId = `optimized_${Date.now()}_${Math.random()}`;
    
    enhancedVehicleDataService.subscribe(subscriberId, (data) => {
      if (isMountedRef.current) {
        debouncedUpdate(data.vehicles);
        setIsLoading(data.isLoading);
        setError(data.error?.message || null);
      }
    });

    refreshData();

    return () => {
      isMountedRef.current = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      enhancedVehicleDataService.unsubscribe(subscriberId);
    };
  }, [refreshData, debouncedUpdate]);

  return {
    vehicles,
    isLoading,
    error,
    refreshData,
    forceSync: () => enhancedVehicleDataService.forceSync()
  };
};
