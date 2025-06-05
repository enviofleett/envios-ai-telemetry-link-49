
import { QueryClient } from '@tanstack/react-query';

export const optimizedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408, 429
        if (error instanceof Error) {
          const status = (error as any)?.status;
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        const status = (error as any)?.status;
        if (status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: 1000,
    },
  },
});

// Add global error handler
optimizedQueryClient.setQueryDefaults(['*'], {
  onError: (error) => {
    console.error('Query error:', error);
  },
});

// Add global mutation error handler
optimizedQueryClient.setMutationDefaults({
  onError: (error) => {
    console.error('Mutation error:', error);
  },
});
