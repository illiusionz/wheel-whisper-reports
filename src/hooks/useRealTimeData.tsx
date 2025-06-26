
import { useState, useEffect, useRef } from 'react';
import { StockQuote } from '@/types/stock';
import { useMarketAwareRefresh } from './realtime/useMarketAwareRefresh';
import { useRateLimitedFetch } from './realtime/useRateLimitedFetch';
import { useVisibilityHandler } from './realtime/useVisibilityHandler';
import { useRealTimeDataFetch } from './realtime/useRealTimeDataFetch';

interface UseRealTimeDataOptions {
  symbol?: string;
  symbols?: string[];
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
  onDataUpdate?: (data: StockQuote | StockQuote[]) => void;
  onError?: (error: Error) => void;
  respectMarketHours?: boolean;
}

interface UseRealTimeDataReturn {
  data: StockQuote | StockQuote[] | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  isAutoRefreshActive: boolean;
  retryConnection: () => void;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
}

export const useRealTimeData = (options: UseRealTimeDataOptions): UseRealTimeDataReturn => {
  const {
    symbol,
    symbols,
    refreshInterval = 30000,
    enableAutoRefresh = false,
    onDataUpdate,
    onError,
    respectMarketHours = true
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Use the specialized hooks
  const { canMakeFetch, recordFetch } = useRateLimitedFetch({ refreshInterval });
  
  const { data, isLoading, error, lastUpdated, fetchData, refresh, retryConnection } = useRealTimeDataFetch({
    symbol,
    symbols,
    onDataUpdate,
    onError,
    respectMarketHours
  });

  const rateLimitedFetchData = async (forceRefresh = false) => {
    if (!mountedRef.current) return;
    if (!canMakeFetch(forceRefresh)) return;
    
    recordFetch();
    await fetchData(forceRefresh);
  };

  const { 
    marketStatus, 
    isAutoRefreshActive, 
    startAutoRefresh: startMarketAwareRefresh, 
    stopAutoRefresh: stopMarketAwareRefresh 
  } = useMarketAwareRefresh({
    respectMarketHours,
    refreshInterval,
    onRefresh: () => rateLimitedFetchData(false),
    enableAutoRefresh,
    symbol,
    symbols
  });

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const newIntervalId = startMarketAwareRefresh();
    intervalRef.current = newIntervalId;
  };

  const stopAutoRefresh = () => {
    stopMarketAwareRefresh(intervalRef.current);
    intervalRef.current = null;
  };

  // Handle page visibility changes
  useVisibilityHandler({
    isAutoRefreshActive,
    enableAutoRefresh,
    startAutoRefresh: () => {
      const newIntervalId = startMarketAwareRefresh();
      intervalRef.current = newIntervalId;
      return newIntervalId;
    },
    stopAutoRefresh,
    intervalRef
  });

  // Initial data fetch
  useEffect(() => {
    rateLimitedFetchData(false);
  }, [symbol, symbols]);

  // Auto-refresh management
  useEffect(() => {
    if (enableAutoRefresh && (symbol || symbols?.length)) {
      startAutoRefresh();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enableAutoRefresh, symbol, symbols, marketStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshActive,
    retryConnection,
    marketStatus
  };
};
