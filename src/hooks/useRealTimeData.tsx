
import { useState, useEffect, useRef, useCallback } from 'react';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';
import { useToast } from '@/hooks/use-toast';

interface UseRealTimeDataOptions {
  symbol?: string;
  symbols?: string[];
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
  onDataUpdate?: (data: StockQuote | StockQuote[]) => void;
  onError?: (error: Error) => void;
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
}

export const useRealTimeData = (options: UseRealTimeDataOptions): UseRealTimeDataReturn => {
  const {
    symbol,
    symbols,
    refreshInterval = 30000,
    enableAutoRefresh = false,
    onDataUpdate,
    onError
  } = options;

  const [data, setData] = useState<StockQuote | StockQuote[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(enableAutoRefresh);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const { toast } = useToast();

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!symbol && !symbols?.length) return;
    if (!mountedRef.current) return;

    // Prevent rapid successive calls
    const now = Date.now();
    const minInterval = Math.min(refreshInterval * 0.1, 5000); // At least 5s between manual calls
    if (!forceRefresh && now - lastFetchRef.current < minInterval) {
      console.log('Skipping fetch due to rate limiting');
      return;
    }

    setIsLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      const stockService = getStockService();
      let result: StockQuote | StockQuote[];

      if (symbols?.length) {
        result = await stockService.getMultipleQuotes(symbols, forceRefresh);
        console.log(`Fetched data for ${symbols.length} symbols`);
      } else if (symbol) {
        result = await stockService.getQuote(symbol, forceRefresh);
        console.log(`Fetched data for ${symbol}`);
      } else {
        throw new Error('No symbol or symbols provided');
      }

      if (!mountedRef.current) return;

      setData(result);
      setLastUpdated(new Date());
      onDataUpdate?.(result);
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Failed to fetch stock data');
      setError(error);
      onError?.(error);
      
      // Only show toast for non-rate-limit errors
      if (!error.message.includes('already in progress') && !error.message.includes('circuit breaker')) {
        toast({
          title: "Data Update Failed",
          description: `Failed to update ${symbol || 'stock data'}. Will retry automatically.`,
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [symbol, symbols, onDataUpdate, onError, toast, refreshInterval]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsAutoRefreshActive(true);
    
    // Add jitter to prevent synchronized requests
    const jitteredInterval = refreshInterval + (Math.random() * 5000);
    intervalRef.current = setInterval(() => fetchData(false), jitteredInterval);
    
    console.log(`Auto-refresh started for ${symbol || symbols?.join(', ')} every ~${Math.round(jitteredInterval/1000)}s`);
  }, [fetchData, refreshInterval, symbol, symbols]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoRefreshActive(false);
    
    console.log(`Auto-refresh stopped for ${symbol || symbols?.join(', ')}`);
  }, [symbol, symbols]);

  // Initial data fetch
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

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
  }, [enableAutoRefresh, startAutoRefresh, symbol, symbols]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Page visibility handling to pause/resume auto-refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoRefresh();
      } else if (enableAutoRefresh && isAutoRefreshActive) {
        startAutoRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableAutoRefresh, isAutoRefreshActive, startAutoRefresh, stopAutoRefresh]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshActive
  };
};
