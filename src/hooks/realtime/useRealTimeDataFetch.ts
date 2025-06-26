
import { useState, useCallback } from 'react';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { MarketHoursService } from '@/services/market/MarketHoursService';

interface UseRealTimeDataFetchOptions {
  symbol?: string;
  symbols?: string[];
  onDataUpdate?: (data: StockQuote | StockQuote[]) => void;
  onError?: (error: Error) => void;
  respectMarketHours: boolean;
}

export const useRealTimeDataFetch = (options: UseRealTimeDataFetchOptions) => {
  const { symbol, symbols, onDataUpdate, onError, respectMarketHours } = options;
  const [data, setData] = useState<StockQuote | StockQuote[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const { error, handleError, clearError, retry, canRetry } = useErrorHandler({
    maxRetries: 3,
    onError,
    showToast: false
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!symbol && !symbols?.length) return;

    // Check market hours before making API calls
    if (respectMarketHours && !forceRefresh && !MarketHoursService.shouldMakeApiCall()) {
      console.log('Skipping API call - market is closed');
      return;
    }

    setIsLoading(true);
    clearError();

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

      setData(result);
      setLastUpdated(new Date());
      onDataUpdate?.(result);
      
    } catch (err) {
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
      setIsLoading(false);
    }
  }, [symbol, symbols, onDataUpdate, handleError, clearError, toast, canRetry, respectMarketHours]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const retryConnection = useCallback(async () => {
    if (canRetry) {
      await retry(() => fetchData(true));
    }
  }, [retry, fetchData, canRetry]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    fetchData,
    refresh,
    retryConnection
  };
};
