import { useState, useEffect, useRef, useCallback } from 'react';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { MarketHoursService } from '@/services/market/MarketHoursService';

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

  const [data, setData] = useState<StockQuote | StockQuote[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(enableAutoRefresh);
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'pre-market' | 'after-hours'>('closed');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const { toast } = useToast();

  const { error, handleError, clearError, retry, canRetry } = useErrorHandler({
    maxRetries: 3,
    onError,
    showToast: false
  });

  // Update market status
  useEffect(() => {
    const updateMarketStatus = () => {
      const marketHours = MarketHoursService.getCurrentMarketHours();
      setMarketStatus(marketHours.currentStatus);
    };

    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!symbol && !symbols?.length) return;
    if (!mountedRef.current) return;

    // Check market hours before making API calls
    if (respectMarketHours && !forceRefresh && !MarketHoursService.shouldMakeApiCall()) {
      console.log('Skipping API call - market is closed');
      return;
    }

    // Prevent rapid successive calls
    const now = Date.now();
    const minInterval = Math.min(refreshInterval * 0.1, 5000);
    if (!forceRefresh && now - lastFetchRef.current < minInterval) {
      console.log('Skipping fetch due to rate limiting');
      return;
    }

    setIsLoading(true);
    clearError();
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
      handleError(error, 'real-time data fetch');
      
      // Show market-aware error messages
      if (respectMarketHours && !MarketHoursService.shouldMakeApiCall()) {
        toast({
          title: "Market Closed",
          description: MarketHoursService.getMarketStatusMessage(),
          variant: "default",
        });
      } else if (!error.message.includes('already in progress') && 
          !error.message.includes('circuit breaker') &&
          !error.message.includes('rate limit')) {
        toast({
          title: "Data Update Failed",
          description: `Failed to update ${symbol || 'stock data'}. ${canRetry ? 'Will retry automatically.' : 'Please try again later.'}`,
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [symbol, symbols, onDataUpdate, handleError, clearError, toast, refreshInterval, canRetry, respectMarketHours]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const retryConnection = useCallback(async () => {
    if (canRetry) {
      await retry(() => fetchData(true));
    }
  }, [retry, fetchData, canRetry]);

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

  // Auto-refresh management with market hours awareness
  useEffect(() => {
    if (enableAutoRefresh && (symbol || symbols?.length)) {
      // Only start auto-refresh if market hours allow it or if we're not respecting market hours
      if (!respectMarketHours || MarketHoursService.shouldMakeApiCall()) {
        startAutoRefresh();
      } else {
        console.log('Auto-refresh disabled - market is closed');
        stopAutoRefresh();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enableAutoRefresh, startAutoRefresh, stopAutoRefresh, symbol, symbols, respectMarketHours, marketStatus]);

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
    isAutoRefreshActive,
    retryConnection,
    marketStatus
  };
};
