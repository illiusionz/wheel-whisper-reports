
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Stock } from './watchlist/types';
import { useWatchlistDatabase } from './watchlist/useWatchlistDatabase';
import { useWatchlistRealTime } from './watchlist/useWatchlistRealTime';
import { getStockService } from '@/services/stock';
import { useToast } from '@/hooks/use-toast';

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const {
    fetchWatchlistFromDB,
    addStockToDB,
    removeStockFromDB,
    updateStockInDB
  } = useWatchlistDatabase();

  const {
    manualRefresh
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

  const refreshWatchlist = async () => {
    if (!user || watchlistSymbols.length === 0 || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const stockService = getStockService();
      const quotes = await stockService.getMultipleQuotes(watchlistSymbols);
      
      if (quotes.length > 0) {
        await manualRefresh(quotes);
        setLastUpdated(new Date());
        toast({
          title: "Watchlist Updated",
          description: `Updated ${quotes.length} stocks`,
        });
      }
    } catch (error) {
      console.error('Failed to refresh watchlist:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
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
    loading,
    isRefreshing,
    addStock,
    removeStock,
    refreshWatchlist,
    refetch: fetchWatchlist,
    lastUpdated,
    isAutoRefreshActive: false,
    startAutoRefresh: () => {},
    stopAutoRefresh: () => {},
  };
};
