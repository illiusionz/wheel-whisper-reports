
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRealTimeData } from './useRealTimeData';
import { StockQuote } from '@/types/stock';

interface UseOptimizedRealTimeDataOptions {
  symbol?: string;
  symbols?: string[];
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
  onDataUpdate?: (data: StockQuote | StockQuote[]) => void;
  onError?: (error: Error) => void;
  respectMarketHours?: boolean;
}

// Debounce helper for batching updates
const useDebouncedCallback = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Memoized data comparison to prevent unnecessary updates
const useStableData = <T>(data: T): T => {
  const ref = useRef<T>(data);
  
  return useMemo(() => {
    if (JSON.stringify(data) !== JSON.stringify(ref.current)) {
      ref.current = data;
    }
    return ref.current;
  }, [data]);
};

export const useOptimizedRealTimeData = (options: UseOptimizedRealTimeDataOptions) => {
  const [batchedUpdates, setBatchedUpdates] = useState<Map<string, StockQuote>>(new Map());
  
  // Debounced callback to batch multiple updates
  const debouncedUpdate = useDebouncedCallback((data: StockQuote | StockQuote[]) => {
    if (options.onDataUpdate) {
      options.onDataUpdate(data);
    }
  }, 100); // 100ms batching window
  
  // Optimized update handler
  const handleDataUpdate = useCallback((data: StockQuote | StockQuote[]) => {
    if (Array.isArray(data)) {
      // Batch multiple symbol updates
      const newBatch = new Map(batchedUpdates);
      data.forEach(quote => {
        newBatch.set(quote.symbol, quote);
      });
      setBatchedUpdates(newBatch);
      debouncedUpdate(Array.from(newBatch.values()));
    } else {
      // Single symbol update
      const newBatch = new Map(batchedUpdates);
      newBatch.set(data.symbol, data);
      setBatchedUpdates(newBatch);
      debouncedUpdate(data);
    }
  }, [batchedUpdates, debouncedUpdate]);
  
  // Use the original hook with optimized callbacks
  const realTimeData = useRealTimeData({
    ...options,
    onDataUpdate: handleDataUpdate,
    // Increase refresh interval slightly to reduce API calls
    refreshInterval: Math.max(options.refreshInterval || 30000, 15000)
  });
  
  // Stabilize the data to prevent unnecessary re-renders
  const stableData = useStableData(realTimeData.data);
  
  return {
    ...realTimeData,
    data: stableData,
    batchedUpdates: Array.from(batchedUpdates.values())
  };
};
