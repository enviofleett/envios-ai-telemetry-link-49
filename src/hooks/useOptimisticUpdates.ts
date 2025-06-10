
import { useState, useCallback } from 'react';
import { workshopCacheService } from '@/services/caching/WorkshopCacheService';

export const useOptimisticUpdates = <T>(cacheKey: string, initialData: T | null = null) => {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimisticUpdate = useCallback(async (
    updateFn: (current: T | null) => T,
    asyncUpdateFn: () => Promise<T>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await workshopCacheService.optimisticUpdate(
        cacheKey,
        updateFn,
        asyncUpdateFn
      );
      
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
      
      // Restore previous data on error
      const cachedData = await workshopCacheService.get<T>(cacheKey);
      setData(cachedData);
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey]);

  const syncWithServer = useCallback(async (
    fetchFn: () => Promise<T>,
    conflictResolver?: (local: T, server: T) => T
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await workshopCacheService.syncWithServer(
        cacheKey,
        fetchFn,
        conflictResolver
      );
      
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey]);

  const invalidate = useCallback(async () => {
    await workshopCacheService.invalidate(cacheKey);
    setData(null);
  }, [cacheKey]);

  return {
    data,
    isLoading,
    error,
    optimisticUpdate,
    syncWithServer,
    invalidate
  };
};
