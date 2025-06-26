
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HistoricalUnusualOptionsData {
  id: string;
  symbol: string;
  strike: number;
  expiration: string;
  contractType: 'call' | 'put';
  volume: number;
  volumeRatio: number;
  price: number;
  openInterest?: number;
  sentiment: string;
  context: string;
  aiAnalysis?: string;
  detectedAt: string;
  weekStart: string;
  isUnusual: boolean;
}

export interface WeeklySentimentData {
  id: string;
  symbol: string;
  weekStart: string;
  weekEnd: string;
  totalUnusualCount: number;
  bullishCount: number;
  bearishCount: number;
  bullishVolume: number;
  bearishVolume: number;
  dominantSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentStrength: number;
  keyStrikes: any[];
  weekSummary?: string;
}

export const useHistoricalOptionsActivity = (symbol: string) => {
  const [historicalData, setHistoricalData] = useState<HistoricalUnusualOptionsData[]>([]);
  const [weeklySentiment, setWeeklySentiment] = useState<WeeklySentimentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const saveUnusualActivity = async (activities: any[]) => {
    if (!user || activities.length === 0) return;

    try {
      const today = new Date();
      const weekStart = await getWeekStart(today);
      
      const recordsToInsert = activities.map(activity => ({
        user_id: user.id,
        symbol: activity.ticker || symbol,
        strike: activity.strike,
        expiration: activity.expiration,
        contract_type: activity.contractType,
        volume: activity.volume,
        volume_ratio: activity.volumeRatio,
        price: activity.price,
        open_interest: activity.openInterest,
        sentiment: activity.sentiment,
        context: activity.context,
        ai_analysis: activity.aiAnalysis,
        week_start: weekStart,
        is_unusual: activity.isUnusual ?? true
      }));

      const { error } = await supabase
        .from('unusual_options_activity')
        .insert(recordsToInsert);

      if (error) {
        console.error('Error saving unusual activity:', error);
        throw error;
      }

      // Update weekly sentiment after saving new data
      await updateWeeklySentiment(symbol, weekStart);
      
      console.log(`Saved ${recordsToInsert.length} unusual activity records for ${symbol}`);
    } catch (err) {
      console.error('Failed to save unusual activity:', err);
      throw err;
    }
  };

  const getWeekStart = async (date: Date) => {
    const { data, error } = await supabase
      .rpc('get_week_start', { input_date: date.toISOString().split('T')[0] });
    
    if (error) throw error;
    return data;
  };

  const getWeekEnd = async (date: Date) => {
    const { data, error } = await supabase
      .rpc('get_week_end', { input_date: date.toISOString().split('T')[0] });
    
    if (error) throw error;
    return data;
  };

  const updateWeeklySentiment = async (symbolToUpdate: string, weekStart: string) => {
    if (!user) return;

    try {
      const weekEnd = await getWeekEnd(new Date(weekStart));

      // Get all unusual activity for this symbol and week
      const { data: weeklyActivity, error: activityError } = await supabase
        .from('unusual_options_activity')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbolToUpdate)
        .eq('week_start', weekStart);

      if (activityError) throw activityError;

      if (!weeklyActivity || weeklyActivity.length === 0) return;

      // Calculate sentiment metrics
      const bullishActivity = weeklyActivity.filter(a => 
        a.sentiment.toLowerCase().includes('bullish') && a.contract_type === 'call'
      );
      const bearishActivity = weeklyActivity.filter(a => 
        a.sentiment.toLowerCase().includes('bearish') && a.contract_type === 'put'
      );

      const bullishVolume = bullishActivity.reduce((sum, a) => sum + a.volume, 0);
      const bearishVolume = bearishActivity.reduce((sum, a) => sum + a.volume, 0);

      const totalVolume = bullishVolume + bearishVolume;
      let dominantSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let sentimentStrength = 0;

      if (totalVolume > 0) {
        const bullishRatio = bullishVolume / totalVolume;
        if (bullishRatio > 0.6) {
          dominantSentiment = 'bullish';
          sentimentStrength = Math.round(bullishRatio * 100);
        } else if (bullishRatio < 0.4) {
          dominantSentiment = 'bearish';
          sentimentStrength = Math.round((1 - bullishRatio) * 100);
        } else {
          sentimentStrength = 50;
        }
      }

      // Get key strikes (most active)
      const strikeVolumes = weeklyActivity.reduce((acc, activity) => {
        const strike = activity.strike.toString();
        acc[strike] = (acc[strike] || 0) + activity.volume;
        return acc;
      }, {} as Record<string, number>);

      const keyStrikes = Object.entries(strikeVolumes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([strike, volume]) => ({ strike: parseFloat(strike), volume }));

      // Upsert weekly sentiment
      const { error: upsertError } = await supabase
        .from('weekly_options_sentiment')
        .upsert({
          user_id: user.id,
          symbol: symbolToUpdate,
          week_start: weekStart,
          week_end: weekEnd,
          total_unusual_count: weeklyActivity.length,
          bullish_count: bullishActivity.length,
          bearish_count: bearishActivity.length,
          bullish_volume: bullishVolume,
          bearish_volume: bearishVolume,
          dominant_sentiment: dominantSentiment,
          sentiment_strength: sentimentStrength,
          key_strikes: keyStrikes
        }, {
          onConflict: 'user_id,symbol,week_start'
        });

      if (upsertError) throw upsertError;

      console.log(`Updated weekly sentiment for ${symbolToUpdate}, week ${weekStart}`);
    } catch (err) {
      console.error('Failed to update weekly sentiment:', err);
    }
  };

  const fetchHistoricalData = async (daysBack = 30) => {
    if (!user || !symbol || symbol === 'Select a stock') return;

    setIsLoading(true);
    setError(null);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('unusual_options_activity')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .gte('detected_at', startDate.toISOString())
        .order('detected_at', { ascending: false });

      if (error) throw error;

      const formattedData: HistoricalUnusualOptionsData[] = (data || []).map(item => ({
        id: item.id,
        symbol: item.symbol,
        strike: parseFloat(item.strike),
        expiration: item.expiration,
        contractType: item.contract_type as 'call' | 'put',
        volume: item.volume,
        volumeRatio: parseFloat(item.volume_ratio),
        price: parseFloat(item.price),
        openInterest: item.open_interest,
        sentiment: item.sentiment,
        context: item.context,
        aiAnalysis: item.ai_analysis,
        detectedAt: item.detected_at,
        weekStart: item.week_start,
        isUnusual: item.is_unusual
      }));

      setHistoricalData(formattedData);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError('Failed to fetch historical data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklySentiment = async (weeksBack = 8) => {
    if (!user || !symbol || symbol === 'Select a stock') return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (weeksBack * 7));

      const { data, error } = await supabase
        .from('weekly_options_sentiment')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .gte('week_start', startDate.toISOString().split('T')[0])
        .order('week_start', { ascending: false });

      if (error) throw error;

      const formattedData: WeeklySentimentData[] = (data || []).map(item => ({
        id: item.id,
        symbol: item.symbol,
        weekStart: item.week_start,
        weekEnd: item.week_end,
        totalUnusualCount: item.total_unusual_count,
        bullishCount: item.bullish_count,
        bearishCount: item.bearish_count,
        bullishVolume: item.bullish_volume,
        bearishVolume: item.bearish_volume,
        dominantSentiment: item.dominant_sentiment as 'bullish' | 'bearish' | 'neutral',
        sentimentStrength: item.sentiment_strength,
        keyStrikes: item.key_strikes || [],
        weekSummary: item.week_summary
      }));

      setWeeklySentiment(formattedData);
    } catch (err) {
      console.error('Error fetching weekly sentiment:', err);
    }
  };

  useEffect(() => {
    if (symbol && symbol !== 'Select a stock') {
      fetchHistoricalData();
      fetchWeeklySentiment();
    }
  }, [symbol, user]);

  return {
    historicalData,
    weeklySentiment,
    isLoading,
    error,
    saveUnusualActivity,
    updateWeeklySentiment,
    refresh: () => {
      fetchHistoricalData();
      fetchWeeklySentiment();
    }
  };
};
