
import { useState, useRef, useCallback } from 'react';

interface RateLimitConfig {
  maxCallsPerMinute: number;
  cacheTTL: number;
  debounceMs: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

export const useRateLimitedAPI = <T>(config: RateLimitConfig) => {
  const [callLog, setCallLog] = useState<number[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const canMakeCall = useCallback(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCalls = callLog.filter(time => time > oneMinuteAgo);
    
    return recentCalls.length < config.maxCallsPerMinute;
  }, [callLog, config.maxCallsPerMinute]);

  const logCall = useCallback(() => {
    const now = Date.now();
    setCallLog(prev => [...prev.filter(time => time > now - 60000), now]);
  }, []);

  const getCachedData = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > config.cacheTTL;
    if (isExpired) {
      cache.current.delete(key);
      return null;
    }
    
    return entry.data;
  }, [config.cacheTTL]);

  const setCachedData = useCallback((key: string, data: T) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }, []);

  const debouncedCall = useCallback(<Args extends any[]>(
    key: string,
    apiCall: (...args: Args) => Promise<T>,
    ...args: Args
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Clear existing timer for this key
      const existingTimer = debounceTimers.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounced timer
      const timer = setTimeout(async () => {
        try {
          // Check cache first
          const cached = getCachedData(key);
          if (cached) {
            resolve(cached);
            return;
          }

          // Check rate limits
          if (!canMakeCall()) {
            setIsBlocked(true);
            reject(new Error('Rate limit exceeded. Please wait a moment.'));
            return;
          }

          // Make API call
          logCall();
          const result = await apiCall(...args);
          setCachedData(key, result);
          setIsBlocked(false);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          debounceTimers.current.delete(key);
        }
      }, config.debounceMs);

      debounceTimers.current.set(key, timer);
    });
  }, [canMakeCall, logCall, getCachedData, setCachedData, config.debounceMs]);

  const getRemainingCalls = useCallback(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCalls = callLog.filter(time => time > oneMinuteAgo);
    return Math.max(0, config.maxCallsPerMinute - recentCalls.length);
  }, [callLog, config.maxCallsPerMinute]);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    debouncedCall,
    canMakeCall,
    isBlocked,
    getRemainingCalls,
    clearCache,
    cacheSize: cache.current.size
  };
};
