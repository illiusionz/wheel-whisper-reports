
import { useRef, useCallback } from 'react';

interface UseRateLimitedFetchOptions {
  refreshInterval: number;
}

export const useRateLimitedFetch = (options: UseRateLimitedFetchOptions) => {
  const { refreshInterval } = options;
  const lastFetchRef = useRef<number>(0);

  const canMakeFetch = useCallback((forceRefresh: boolean = false): boolean => {
    if (forceRefresh) return true;

    const now = Date.now();
    const minInterval = Math.min(refreshInterval * 0.1, 5000);
    
    if (now - lastFetchRef.current < minInterval) {
      console.log('Skipping fetch due to rate limiting');
      return false;
    }

    return true;
  }, [refreshInterval]);

  const recordFetch = useCallback(() => {
    lastFetchRef.current = Date.now();
  }, []);

  return {
    canMakeFetch,
    recordFetch
  };
};
