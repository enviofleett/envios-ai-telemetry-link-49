
import { useState, useEffect, useCallback, useRef } from 'react';
import { VehicleData } from '@/types/vehicle';
import { enhancedVehicleDataService } from '@/services/enhancedVehicleDataService';
import { useToast } from '@/hooks/use-toast';

// Debounced update hook to prevent memory leaks and improve performance
export const useOptimizedVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use refs to track component mounting and prevent memory leaks
  const isMountedRef = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  // Debounced update function to prevent rapid state changes
  const debouncedUpdate = useCallback((newVehicles: VehicleData[]) => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Minimum 500ms between updates to prevent overwhelming the UI
    const delay = Math.max(0, 500 - timeSinceLastUpdate);
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setVehicles(newVehicles);
        lastUpdateRef.current = Date.now();
      }
    }, delay);
  }, []);

  // Optimized subscription handler
  const handleVehicleUpdate = useCallback(() => {
    if (!isMountedRef.current) return;
    
    try {
      const updatedVehicles = enhancedVehicleDataService.getEnhancedVehicles();
      debouncedUpdate(updatedVehicles);
      setError(null);
    } catch (err) {
      console.error('Error updating vehicles:', err);
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update vehicles';
        setError(errorMessage);
        toast({
          title: "Vehicle Update Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  }, [debouncedUpdate, toast]);

  // Force refresh function
  const refreshVehicles = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await enhancedVehicleDataService.forceSync();
      handleVehicleUpdate();
    } catch (err) {
      console.error('Error refreshing vehicles:', err);
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to refresh vehicles';
        setError(errorMessage);
        toast({
          title: "Refresh Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [handleVehicleUpdate, toast]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Subscribe to vehicle updates
    const unsubscribe = enhancedVehicleDataService.subscribe(handleVehicleUpdate);
    
    // Initial load
    handleVehicleUpdate();
    setIsLoading(false);
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      unsubscribe();
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [handleVehicleUpdate]);

  return {
    vehicles,
    isLoading,
    error,
    refreshVehicles,
  };
};
