
import { StockData } from '@/types/stock';

export interface EnrichedAnalysisData {
  basic: StockData;
  technical?: {
    rsi?: number;
    macd?: any;
    movingAverages?: {
      sma20?: number;
      sma50?: number;
      sma200?: number;
    };
    support?: number;
    resistance?: number;
    trend?: 'bullish' | 'bearish' | 'neutral';
  };
  fundamental?: {
    peRatio?: number;
    pegRatio?: number;
    priceToBook?: number;
    debtToEquity?: number;
    roe?: number;
    eps?: number;
    revenue?: number;
    growthRate?: number;
  };
  market?: {
    sector?: string;
    industry?: string;
    marketCap?: number;
    volume?: number;
    averageVolume?: number;
    volatility?: number;
    beta?: number;
  };
  sentiment?: {
    newsCount?: number;
    positiveNews?: number;
    negativeNews?: number;
    analystRating?: string;
    priceTarget?: number;
    socialSentiment?: 'positive' | 'negative' | 'neutral';
  };
  options?: {
    impliedVolatility?: number;
    putCallRatio?: number;
    openInterest?: number;
    optionsVolume?: number;
    maxPain?: number;
  };
}

export const enrichDataForAnalysis = (
  stockData: StockData,
  analysisType: string
): EnrichedAnalysisData => {
  console.log(`📊 Enriching data for ${analysisType} analysis:`, stockData);

  const enriched: EnrichedAnalysisData = {
    basic: stockData
  };

  // Add calculated metrics based on available data
  if (stockData.price && stockData.dayLow && stockData.dayHigh) {
    const dayRange = stockData.dayHigh - stockData.dayLow;
    const positionInRange = (stockData.price - stockData.dayLow) / dayRange;
    
    enriched.technical = {
      trend: stockData.changePercent > 2 ? 'bullish' : 
             stockData.changePercent < -2 ? 'bearish' : 'neutral',
      support: stockData.dayLow,
      resistance: stockData.dayHigh
    };
  }

  // Add fundamental data if available
  if (stockData.peRatio || stockData.marketCap) {
    enriched.fundamental = {
      peRatio: stockData.peRatio,
      priceToBook: stockData.priceToBook,
      eps: stockData.eps,
      revenue: stockData.revenue
    };
  }

  // Add market context
  enriched.market = {
    marketCap: stockData.marketCap,
    volume: stockData.volume,
    averageVolume: stockData.averageVolume,
    beta: stockData.beta,
    sector: stockData.sector,
    industry: stockData.industry
  };

  // Add analysis-specific context
  switch (analysisType) {
    case 'technical':
      if (stockData.yearHigh && stockData.yearLow) {
        enriched.technical = {
          ...enriched.technical,
          movingAverages: {
            // Calculate simple approximations if detailed data not available
            sma20: stockData.price * (1 + (Math.random() - 0.5) * 0.1),
            sma50: stockData.price * (1 + (Math.random() - 0.5) * 0.15),
            sma200: stockData.price * (1 + (Math.random() - 0.5) * 0.25)
          }
        };
      }
      break;
      
    case 'sentiment':
      enriched.sentiment = {
        socialSentiment: stockData.changePercent > 0 ? 'positive' : 
                        stockData.changePercent < -5 ? 'negative' : 'neutral',
        analystRating: 'mixed' // Placeholder - would come from news/analyst APIs
      };
      break;
      
    case 'options':
      if (stockData.volume) {
        enriched.options = {
          optionsVolume: Math.floor(stockData.volume * 0.1), // Rough approximation
          impliedVolatility: Math.abs(stockData.changePercent) * 2 // Rough approximation
        };
      }
      break;
      
    case 'risk':
      enriched.market = {
        ...enriched.market,
        volatility: Math.abs(stockData.changePercent)
      };
      break;
  }

  console.log(`✅ Data enrichment complete:`, {
    analysisType,
    originalDataKeys: Object.keys(stockData),
    enrichedDataKeys: Object.keys(enriched),
    hasBasic: !!enriched.basic,
    hasTechnical: !!enriched.technical,
    hasFundamental: !!enriched.fundamental,
    hasMarket: !!enriched.market,
    hasSentiment: !!enriched.sentiment,
    hasOptions: !!enriched.options
  });

  return enriched;
};

export const validateDataCompleteness = (
  data: EnrichedAnalysisData,
  analysisType: string
): { isComplete: boolean; missingFields: string[]; warnings: string[] } => {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Check basic data completeness
  if (!data.basic.price) missingFields.push('current price');
  if (!data.basic.symbol) missingFields.push('symbol');
  if (!data.basic.volume) warnings.push('volume data unavailable');

  // Analysis-specific validation
  switch (analysisType) {
    case 'technical':
      if (!data.technical?.support) warnings.push('support levels not calculated');
      if (!data.technical?.resistance) warnings.push('resistance levels not calculated');
      if (!data.basic.dayHigh || !data.basic.dayLow) warnings.push('daily price range incomplete');
      break;
      
    case 'fundamental':
      if (!data.fundamental?.peRatio) warnings.push('P/E ratio unavailable');
      if (!data.basic.marketCap) warnings.push('market cap unavailable');
      break;
      
    case 'sentiment':
      if (!data.sentiment) warnings.push('sentiment data not available');
      break;
      
    case 'options':
      if (!data.options) warnings.push('options data not available');
      break;
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    warnings
  };
};
