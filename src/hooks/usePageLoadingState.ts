
import { useState, useEffect } from 'react';

interface PageLoadingState {
  isInitialLoading: boolean;
  isError: boolean;
  error: Error | null;
  retryCount: number;
}

interface UsePageLoadingOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export const usePageLoadingState = (options: UsePageLoadingOptions = {}) => {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  
  const [state, setState] = useState<PageLoadingState>({
    isInitialLoading: true,
    isError: false,
    error: null,
    retryCount: 0
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isInitialLoading: loading }));
  };

  const setError = (error: Error | null) => {
    setState(prev => ({ 
      ...prev, 
      isError: !!error, 
      error,
      isInitialLoading: false 
    }));
  };

  const retry = () => {
    if (state.retryCount < maxRetries) {
      setState(prev => ({ 
        ...prev, 
        retryCount: prev.retryCount + 1,
        isError: false,
        error: null,
        isInitialLoading: true
      }));
      
      setTimeout(() => {
        // Trigger retry logic here
      }, retryDelay);
    }
  };

  const reset = () => {
    setState({
      isInitialLoading: false,
      isError: false,
      error: null,
      retryCount: 0
    });
  };

  return {
    ...state,
    setLoading,
    setError,
    retry,
    reset,
    canRetry: state.retryCount < maxRetries
  };
};
