
import { useCallback } from 'react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { StockQuote } from '@/types/stock';
import { Stock } from './types';

interface UseWatchlistRealTimeProps {
  watchlistSymbols: string[];
  onDataUpdate: (watchlist: Stock[]) => void;
  onDatabaseUpdate: (stockQuotes: StockQuote[]) => void;
}

export const useWatchlistRealTime = ({
  watchlistSymbols,
  onDataUpdate,
  onDatabaseUpdate
}: UseWatchlistRealTimeProps) => {
  
  const updateWatchlistWithRealTimeData = useCallback(async (stockQuotes: StockQuote[]) => {
    if (!Array.isArray(stockQuotes)) return;

    const formattedWatchlist: Stock[] = stockQuotes.map(quote => ({
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
    }));

    onDataUpdate(formattedWatchlist);
    onDatabaseUpdate(stockQuotes);
  }, [onDataUpdate, onDatabaseUpdate]);

  const { 
    data: realTimeData, 
    isLoading: isRealTimeLoading,
    lastUpdated,
    isAutoRefreshActive,
    startAutoRefresh,
    stopAutoRefresh
  } = useRealTimeData({
    symbols: watchlistSymbols.length > 0 ? watchlistSymbols : undefined,
    refreshInterval: 30000, // 30 seconds for watchlist (increased from 15s to be more conservative)
    enableAutoRefresh: watchlistSymbols.length > 0,
    onDataUpdate: (data) => {
      if (Array.isArray(data)) {
        updateWatchlistWithRealTimeData(data);
      }
    },
    onError: (error) => {
      console.error('Real-time watchlist update failed:', error);
    }
  });

  return {
    isRealTimeLoading,
    lastUpdated,
    isAutoRefreshActive,
    startAutoRefresh,
    stopAutoRefresh
  };
};
