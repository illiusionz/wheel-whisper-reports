
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';
import { Stock, WatchlistItem } from './types';

export const useWatchlistDatabase = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWatchlistFromDB = async (): Promise<{ symbols: string[], watchlist: Stock[] }> => {
    if (!user) return { symbols: [], watchlist: [] };

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
        return { symbols: [], watchlist: [] };
      }

      const symbols = data.map(item => item.symbol);
      const formattedWatchlist: Stock[] = data.map((item: WatchlistItem) => ({
        symbol: item.symbol,
        name: item.name,
        price: item.price || 0,
        change: item.change_amount || 0,
        changePercent: item.change_percent || 0,
      }));
      
      return { symbols, watchlist: formattedWatchlist };
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to load watchlist",
        variant: "destructive",
      });
      return { symbols: [], watchlist: [] };
    }
  };

  const addStockToDB = async (symbol: string): Promise<{ success: boolean, stock?: Stock }> => {
    if (!user) return { success: false };

    try {
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
        if (error.code === '23505') {
          toast({
            title: "Stock Already Added",
            description: `${symbol.toUpperCase()} is already in your watchlist`,
            variant: "destructive",
          });
          return { success: false };
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

      toast({
        title: "Stock Added",
        description: `${stockQuote.symbol} has been added to your watchlist`,
      });

      return { success: true, stock: newStock };
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: "Error",
        description: "Failed to add stock to watchlist. Please check the symbol and try again.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const removeStockFromDB = async (symbol: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);

      if (error) throw error;

      toast({
        title: "Stock Removed",
        description: `${symbol} has been removed from your watchlist`,
      });

      return true;
    } catch (error) {
      console.error('Error removing stock:', error);
      toast({
        title: "Error",
        description: "Failed to remove stock from watchlist",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateStockInDB = async (stockQuotes: StockQuote[]) => {
    if (!user) return;

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

  return {
    fetchWatchlistFromDB,
    addStockToDB,
    removeStockFromDB,
    updateStockInDB
  };
};
