
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
        // Try to get real unusual activity data
        const unusualData = await (stockService as any).getUnusualOptionsActivity?.(symbol);
        
        if (unusualData && unusualData.length > 0) {
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
          // Fallback to mock unusual activity data
          setData(generateMockUnusualActivity(symbol));
        }
        
      } else {
        // Use mock data for providers without advanced features
        setData(generateMockUnusualActivity(symbol));
      }
      
    } catch (err) {
      console.error('Error fetching unusual options activity:', err);
      setError('Failed to fetch unusual options activity');
      setData(generateMockUnusualActivity(symbol));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockUnusualActivity = (stockSymbol: string): UnusualOptionsData[] => {
    const basePrice = 50; // Mock base price
    
    return [
      {
        ticker: `${stockSymbol}062724C00052000`,
        strike: 52.00,
        expiration: '2025-06-27',
        contractType: 'call',
        volume: 15420,
        volumeRatio: 8.7,
        price: 2.45,
        sentiment: 'Very Bullish',
        context: 'Massive call buying',
        isUnusual: true,
        openInterest: 8420,
        aiAnalysis: 'This unusual call activity suggests strong bullish sentiment with traders betting on a significant upside move above $52. The 8.7x volume spike indicates institutional or informed money flow.'
      },
      {
        ticker: `${stockSymbol}062724P00048000`,
        strike: 48.00,
        expiration: '2025-06-27',
        contractType: 'put',
        volume: 9800,
        volumeRatio: 5.2,
        price: 1.85,
        sentiment: 'Bearish',
        context: 'Heavy put activity',
        isUnusual: true,
        openInterest: 12450,
        aiAnalysis: 'Significant put buying suggests either hedging activity or bearish positioning. The concentration at $48 strike indicates this is a key support level that traders are concerned about.'
      },
      {
        ticker: `${stockSymbol}070324C00055000`,
        strike: 55.00,
        expiration: '2025-07-03',
        contractType: 'call',
        volume: 6750,
        volumeRatio: 4.1,
        price: 1.20,
        sentiment: 'Bullish',
        context: 'Large call sweep',
        isUnusual: true,
        openInterest: 5680
      },
      {
        ticker: `${stockSymbol}070324P00045000`,
        strike: 45.00,
        expiration: '2025-07-03',
        contractType: 'put',
        volume: 4200,
        volumeRatio: 3.8,
        price: 0.95,
        sentiment: 'Moderately Bearish',
        context: 'Protective put buying',
        isUnusual: true,
        openInterest: 7890
      },
      {
        ticker: `${stockSymbol}071824C00058000`,
        strike: 58.00,
        expiration: '2025-07-18',
        contractType: 'call',
        volume: 3850,
        volumeRatio: 2.9,
        price: 1.75,
        sentiment: 'Bullish',
        context: 'Bullish positioning',
        isUnusual: true,
        openInterest: 3420
      }
    ];
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
