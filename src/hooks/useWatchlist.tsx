import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { StockQuote } from '@/types/stock';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number | null;
  change_amount: number | null;
  change_percent: number | null;
  created_at: string;
  updated_at: string;
}

export const useWatchlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);

  // Use real-time data hook for watchlist updates
  const { 
    data: realTimeData, 
    isLoading: isRealTimeLoading,
    lastUpdated,
    isAutoRefreshActive,
    startAutoRefresh,
    stopAutoRefresh
  } = useRealTimeData({
    symbols: watchlistSymbols,
    refreshInterval: 15000, // 15 seconds for watchlist
    enableAutoRefresh: true,
    onDataUpdate: (data) => {
      if (Array.isArray(data)) {
        updateWatchlistWithRealTimeData(data);
      }
    },
    onError: (error) => {
      console.error('Real-time watchlist update failed:', error);
    }
  });

  const updateWatchlistWithRealTimeData = async (stockQuotes: StockQuote[]) => {
    if (!user) return;

    const formattedWatchlist: Stock[] = stockQuotes.map(quote => ({
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
    }));

    setWatchlist(formattedWatchlist);

    // Update database with fresh data
    for (const quote of stockQuotes) {
      try {
        await supabase
          .from('watchlists')
          .update({
            name: quote.name,
            price: quote.price,
            change_amount: quote.change,
            change_percent: quote.changePercent,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('symbol', quote.symbol);
      } catch (error) {
        console.error(`Failed to update ${quote.symbol} in database:`, error);
      }
    }
  };

  const fetchWatchlist = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching watchlist:', error);
        toast({
          title: "Error",
          description: "Failed to load watchlist",
          variant: "destructive",
        });
        return;
      }

      // Extract symbols for real-time updates
      const symbols = data.map(item => item.symbol);
      setWatchlistSymbols(symbols);

      // Set initial watchlist data from database
      const formattedWatchlist: Stock[] = data.map((item: WatchlistItem) => ({
        symbol: item.symbol,
        name: item.name,
        price: item.price || 0,
        change: item.change_amount || 0,
        changePercent: item.change_percent || 0,
      }));
      
      setWatchlist(formattedWatchlist);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to load watchlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (symbol: string) => {
    if (!user) return;

    try {
      // Get real stock data
      const stockService = getStockService();
      const stockQuote = await stockService.getQuote(symbol);

      const { data, error } = await supabase
        .from('watchlists')
        .insert({
          user_id: user.id,
          symbol: stockQuote.symbol,
          name: stockQuote.name,
          price: stockQuote.price,
          change_amount: stockQuote.change,
          change_percent: stockQuote.changePercent,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Stock Already Added",
            description: `${symbol.toUpperCase()} is already in your watchlist`,
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Update symbols list for real-time updates
      setWatchlistSymbols(prev => [...prev, stockQuote.symbol]);

      const newStock: Stock = {
        symbol: stockQuote.symbol,
        name: stockQuote.name,
        price: stockQuote.price,
        change: stockQuote.change,
        changePercent: stockQuote.changePercent,
      };

      setWatchlist(prev => [...prev, newStock]);
      
      toast({
        title: "Stock Added",
        description: `${stockQuote.symbol} has been added to your watchlist`,
      });
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist. Please check the symbol and try again.",
        variant: "destructive",
      });
    }
  };

  const removeStock = async (symbol: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);

      if (error) throw error;

      // Update symbols list for real-time updates
      setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
      setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
      
      toast({
        title: "Stock Removed",
        description: `${symbol} has been removed from your watchlist`,
      });
    } catch (error) {
      console.error('Error removing stock:', error);
      toast({
        title: "Error",
        description: "Failed to remove stock from watchlist",
        variant: "destructive",
      });
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
