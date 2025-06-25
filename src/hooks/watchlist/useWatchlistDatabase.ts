
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';
import { Stock, WatchlistItem } from './types';
import { validateStockSymbol, validateStockQuote, sanitizeSymbol } from '@/utils/validation';

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
      // Validate and sanitize symbol
      const sanitizedSymbol = sanitizeSymbol(symbol);
      const validatedSymbol = validateStockSymbol(sanitizedSymbol);
      
      const stockService = getStockService();
      const stockQuote = await stockService.getQuote(validatedSymbol);
      
      // Validate the stock quote response
      const validatedQuote = validateStockQuote(stockQuote);

      const { data, error } = await supabase
        .from('watchlists')
        .insert({
          user_id: user.id,
          symbol: validatedQuote.symbol,
          name: validatedQuote.name,
          price: validatedQuote.price,
          change_amount: validatedQuote.change,
          change_percent: validatedQuote.changePercent,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Stock Already Added",
            description: `${validatedSymbol} is already in your watchlist`,
            variant: "destructive",
          });
          return { success: false };
        }
        throw error;
      }

      const newStock: Stock = {
        symbol: validatedQuote.symbol,
        name: validatedQuote.name,
        price: validatedQuote.price,
        change: validatedQuote.change,
        changePercent: validatedQuote.changePercent,
      };

      toast({
        title: "Stock Added",
        description: `${validatedQuote.symbol} has been added to your watchlist`,
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
      // Validate symbol before deletion
      const validatedSymbol = validateStockSymbol(sanitizeSymbol(symbol));
      
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', validatedSymbol);

      if (error) throw error;

      toast({
        title: "Stock Removed",
        description: `${validatedSymbol} has been removed from your watchlist`,
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
        // Validate each quote before updating
        const validatedQuote = validateStockQuote(quote);
        
        await supabase
          .from('watchlists')
          .update({
            name: validatedQuote.name,
            price: validatedQuote.price,
            change_amount: validatedQuote.change,
            change_percent: validatedQuote.changePercent,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('symbol', validatedQuote.symbol);
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
