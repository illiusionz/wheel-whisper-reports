
import { useState, useEffect, useRef, useCallback } from 'react';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';
import { useToast } from '@/hooks/use-toast';

interface UseRealTimeDataOptions {
  symbol?: string;
  symbols?: string[];
  refreshInterval?: number; // in milliseconds
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
    refreshInterval = 30000, // default 30 seconds
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
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!symbol && !symbols?.length) return;

    setIsLoading(true);
    setError(null);

    try {
      const stockService = getStockService();
      let result: StockQuote | StockQuote[];

      if (symbols?.length) {
        result = await stockService.getMultipleQuotes(symbols);
      } else if (symbol) {
        result = await stockService.getQuote(symbol);
      } else {
        throw new Error('No symbol or symbols provided');
      }

      setData(result);
      setLastUpdated(new Date());
      onDataUpdate?.(result);
      
      console.log(`Real-time data updated for ${symbol || symbols?.join(', ')}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch stock data');
      setError(error);
      onError?.(error);
      
      toast({
        title: "Data Update Failed",
        description: `Failed to update ${symbol || 'stock data'}. Retrying...`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [symbol, symbols, onDataUpdate, onError, toast]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsAutoRefreshActive(true);
    intervalRef.current = setInterval(fetchData, refreshInterval);
    
    console.log(`Auto-refresh started for ${symbol || symbols?.join(', ')} every ${refreshInterval}ms`);
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
    fetchData();
  }, [fetchData]);

  // Auto-refresh management
  useEffect(() => {
    if (enableAutoRefresh) {
      startAutoRefresh();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enableAutoRefresh, startAutoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    isAutoRefreshActive
  };
};
