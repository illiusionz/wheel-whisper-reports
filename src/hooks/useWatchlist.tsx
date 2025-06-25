
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Stock } from './watchlist/types';
import { useWatchlistDatabase } from './watchlist/useWatchlistDatabase';
import { useWatchlistRealTime } from './watchlist/useWatchlistRealTime';

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);

  const {
    fetchWatchlistFromDB,
    addStockToDB,
    removeStockFromDB,
    updateStockInDB
  } = useWatchlistDatabase();

  const {
    isRealTimeLoading,
    lastUpdated,
    isAutoRefreshActive,
    startAutoRefresh,
    stopAutoRefresh
  } = useWatchlistRealTime({
    watchlistSymbols,
    onDataUpdate: setWatchlist,
    onDatabaseUpdate: updateStockInDB
  });

  const fetchWatchlist = async () => {
    if (!user) return;

    try {
      const { symbols, watchlist: fetchedWatchlist } = await fetchWatchlistFromDB();
      setWatchlistSymbols(symbols);
      setWatchlist(fetchedWatchlist);
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (symbol: string) => {
    if (!user) return;

    const result = await addStockToDB(symbol);
    if (result.success && result.stock) {
      setWatchlistSymbols(prev => [...prev, result.stock!.symbol]);
      setWatchlist(prev => [...prev, result.stock!]);
    }
  };

  const removeStock = async (symbol: string) => {
    if (!user) return;

    const success = await removeStockFromDB(symbol);
    if (success) {
      setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
      setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
    }
  };

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    } else {
      setWatchlist([]);
      setWatchlistSymbols([]);
      setLoading(false);
    }
  }, [user]);

  return {
    watchlist,
    loading: loading || isRealTimeLoading,
    addStock,
    removeStock,
    refetch: fetchWatchlist,
    lastUpdated,
    isAutoRefreshActive,
    startAutoRefresh,
    stopAutoRefresh,
  };
};
