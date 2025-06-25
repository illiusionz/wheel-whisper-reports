import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getStockService } from '@/services/stock';

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

      // Fetch real-time stock data for all symbols
      if (data.length > 0) {
        const stockService = getStockService();
        const symbols = data.map(item => item.symbol);
        
        try {
          const stockQuotes = await stockService.getMultipleQuotes(symbols);
          
          // Update database with fresh stock data
          const updates = stockQuotes.map(quote => ({
            symbol: quote.symbol,
            name: quote.name,
            price: quote.price,
            change_amount: quote.change,
            change_percent: quote.changePercent,
            updated_at: new Date().toISOString()
          }));

          // Batch update the database
          for (const update of updates) {
            await supabase
              .from('watchlists')
              .update({
                name: update.name,
                price: update.price,
                change_amount: update.change_amount,
                change_percent: update.change_percent,
                updated_at: update.updated_at
              })
              .eq('user_id', user.id)
              .eq('symbol', update.symbol);
          }

          // Set the watchlist with fresh data
          const formattedWatchlist: Stock[] = stockQuotes.map(quote => ({
            symbol: quote.symbol,
            name: quote.name,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
          }));

          setWatchlist(formattedWatchlist);
        } catch (stockError) {
          console.error('Error fetching stock data:', stockError);
          // Fall back to database data if stock service fails
          const formattedWatchlist: Stock[] = data.map((item: WatchlistItem) => ({
            symbol: item.symbol,
            name: item.name,
            price: item.price || 0,
            change: item.change_amount || 0,
            changePercent: item.change_percent || 0,
          }));
          setWatchlist(formattedWatchlist);
        }
      } else {
        setWatchlist([]);
      }
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
      setLoading(false);
    }
  }, [user]);

  return {
    watchlist,
    loading,
    addStock,
    removeStock,
    refetch: fetchWatchlist,
  };
};
