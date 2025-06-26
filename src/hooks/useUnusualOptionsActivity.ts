
import { useState, useEffect } from 'react';
import { getStockService } from '@/services/stock';
import { useAIAnalysis } from './useAIAnalysis';

export interface UnusualOptionsData {
  ticker: string;
  strike: number;
  expiration: string;
  contractType: 'call' | 'put';
  volume: number;
  volumeRatio: number;
  price: number;
  sentiment: string;
  context: string;
  isUnusual: boolean;
  aiAnalysis?: string;
  openInterest?: number;
}

export const useUnusualOptionsActivity = (symbol: string) => {
  const [data, setData] = useState<UnusualOptionsData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAIAnalysis } = useAIAnalysis();

  const fetchUnusualActivity = async () => {
    if (!symbol || symbol === 'Select a stock') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const stockService = getStockService();
      
      if (stockService.hasAdvancedFeatures()) {
        console.log(`Fetching real unusual options activity for ${symbol} using Polygon`);
        
        // Try to get real unusual activity data from Polygon
        const unusualData = await (stockService as any).getUnusualOptionsActivity?.(symbol);
        
        if (unusualData && unusualData.length > 0) {
          console.log(`Found ${unusualData.length} unusual options contracts for ${symbol}`);
          
          // Enhance with AI analysis for the most significant activities
          const enhancedData = await Promise.all(
            unusualData.slice(0, 3).map(async (item: UnusualOptionsData) => {
              try {
                const aiAnalysis = await getAIAnalysis(
                  symbol,
                  'options',
                  {
                    contract: item,
                    analysis: `Analyze this unusual options activity: ${item.context} for ${symbol}. 
                    Volume ratio: ${item.volumeRatio}x normal. 
                    Current sentiment: ${item.sentiment}.
                    Strike: $${item.strike}, Expiration: ${item.expiration}.
                    What does this suggest about market expectations?`
                  }
                );
                
                return {
                  ...item,
                  aiAnalysis: aiAnalysis?.analysis || undefined
                };
              } catch (error) {
                console.log('AI analysis failed for options:', error);
                return item;
              }
            })
          );
          
          // Add remaining items without AI analysis
          const remainingData = unusualData.slice(3);
          setData([...enhancedData, ...remainingData]);
        } else {
          console.warn(`No unusual options activity found for ${symbol} - this may indicate low activity or API limitations`);
          setError(`No unusual options activity detected for ${symbol}. This could mean low trading volume or limited data availability.`);
          setData([]);
        }
        
      } else {
        console.warn('Advanced features not available - provider does not support unusual options activity');
        setError('Unusual options activity requires a configured Polygon API provider. Please configure your API key in settings.');
        setData([]);
      }
      
    } catch (err) {
      console.error('Error fetching unusual options activity:', err);
      setError(`Failed to fetch unusual options activity: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnusualActivity();
  }, [symbol]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchUnusualActivity
  };
};
