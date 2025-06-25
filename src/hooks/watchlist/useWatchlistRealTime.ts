
import { useCallback } from 'react';
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

  // Return manual refresh capability instead of auto-refresh
  return {
    isRealTimeLoading: false,
    lastUpdated: null,
    isAutoRefreshActive: false,
    startAutoRefresh: () => console.log('Auto-refresh disabled for rate limit protection'),
    stopAutoRefresh: () => console.log('Auto-refresh already disabled'),
    manualRefresh: updateWatchlistWithRealTimeData
  };
};
