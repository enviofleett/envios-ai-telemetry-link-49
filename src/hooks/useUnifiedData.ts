
import { useState, useEffect } from 'react';
import { unifiedDataService, DataServiceResult, UnifiedVehicleData } from '@/services/unified/UnifiedDataService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UseUnifiedDataResult {
  vehicles: UnifiedVehicleData[];
  userProfile: any;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  healthStatus: 'healthy' | 'unhealthy' | 'checking';
}

export const useUnifiedData = (): UseUnifiedDataResult => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const { toast } = useToast();
  
  const [vehicles, setVehicles] = useState<UnifiedVehicleData[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');

  const fetchData = async () => {
    if (!isAuthenticated || !user) {
      console.log('⚠️ User not authenticated, skipping data fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching unified data for user:', user.id);

      // Fetch vehicles and user profile concurrently
      const [vehiclesResult, profileResult] = await Promise.all([
        unifiedDataService.getVehiclesForUser(user.id),
        unifiedDataService.getUserProfile(user.id)
      ]);

      // Handle vehicles result
      if (vehiclesResult.success) {
        setVehicles(vehiclesResult.data || []);
        console.log('✅ Vehicles loaded:', vehiclesResult.data?.length || 0);
      } else {
        console.error('❌ Failed to load vehicles:', vehiclesResult.error);
        setError(vehiclesResult.error || 'Failed to load vehicles');
      }

      // Handle profile result
      if (profileResult.success) {
        setUserProfile(profileResult.data);
        console.log('✅ User profile loaded');
      } else {
        console.warn('⚠️ Failed to load user profile:', profileResult.error);
        // Don't set this as a critical error since vehicles might still work
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Data fetch error:', error);
      setError(errorMessage);
      
      toast({
        title: "Data Loading Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      setHealthStatus('checking');
      const healthResult = await unifiedDataService.healthCheck();
      setHealthStatus(healthResult.success ? 'healthy' : 'unhealthy');
    } catch (error) {
      setHealthStatus('unhealthy');
    }
  };

  const refreshData = async () => {
    if (user) {
      await unifiedDataService.invalidateUserCache(user.id);
      await fetchData();
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    checkHealth();
  }, [isAuthenticated, user?.id]);

  // Periodic health check
  useEffect(() => {
    const healthInterval = setInterval(checkHealth, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(healthInterval);
  }, []);

  return {
    vehicles,
    userProfile,
    loading,
    error,
    refreshData,
    healthStatus
  };
};
