
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
      // Generate mock data for now (will be replaced with real API later)
      const mockPrice = Math.random() * 200 + 50;
      const mockChange = (Math.random() - 0.5) * 10;
      const mockChangePercent = (Math.random() - 0.5) * 5;

      const { data, error } = await supabase
        .from('watchlists')
        .insert({
          user_id: user.id,
          symbol: symbol.toUpperCase(),
          name: `${symbol.toUpperCase()} Corporation`,
          price: mockPrice,
          change_amount: mockChange,
          change_percent: mockChangePercent,
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
        symbol: data.symbol,
        name: data.name,
        price: data.price || 0,
        change: data.change_amount || 0,
        changePercent: data.change_percent || 0,
      };

      setWatchlist(prev => [...prev, newStock]);
      
      toast({
        title: "Stock Added",
        description: `${symbol.toUpperCase()} has been added to your watchlist`,
      });
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist",
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
