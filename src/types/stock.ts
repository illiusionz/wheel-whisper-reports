
import { MarketStatus } from './market';
import { ApiResponse } from './api';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: string;
  dayHigh?: number;
  dayLow?: number;
  yearHigh?: number;
  yearLow?: number;
  averageVolume?: number;
  beta?: number;
  peRatio?: number;
  dividendYield?: number;
}

export interface StockProvider {
  name: string;
  getQuote(symbol: string, forceRefresh?: boolean): Promise<StockQuote>;
  getMultipleQuotes(symbols: string[], forceRefresh?: boolean): Promise<StockQuote[]>;
  isConfigured(): boolean;
  hasAdvancedFeatures?(): boolean;
  getOptionsChain?(symbol: string, expiration?: string, strikePrice?: number, contractType?: 'call' | 'put'): Promise<OptionsContract[]>;
  getHistoricalData?(symbol: string, timespan?: 'day' | 'week' | 'month', from?: string, to?: string): Promise<HistoricalDataPoint[]>;
  getWheelStrategyData?(symbol: string, targetStrike?: number): Promise<WheelStrategyData>;
}

export interface StockServiceConfig {
  provider: 'finnhub' | 'alpha-vantage' | 'polygon' | 'mock';
  apiKey?: string;
  fallbackProvider?: 'finnhub' | 'alpha-vantage' | 'polygon' | 'mock';
  rateLimiting?: {
    requestsPerMinute: number;
    burstLimit: number;
    cacheTTL: number;
  };
}

export interface ProviderCapabilities {
  realTimeQuotes: boolean;
  historicalData: boolean;
  optionsData: boolean;
  fundamentals: boolean;
  news: boolean;
  rateLimits: {
    requestsPerMinute: number;
    dailyLimit?: number;
  };
}

// Advanced types for Polygon features
export interface OptionsContract {
  ticker: string;
  strike_price: number;
  expiration_date: string;
  contract_type: 'call' | 'put';
  exercise_style?: string;
  shares_per_contract?: number;
  underlying_ticker: string;
  bid?: number;
  ask?: number;
  last_price?: number;
  volume?: number;
  open_interest?: number;
  implied_volatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface WheelStrategyData {
  currentPrice: number;
  volatility: number;
  suitablePutStrikes: Array<{
    strike: number;
    expiration: string;
    ticker: string;
    premium: number;
    probability: number;
    annualizedReturn: number;
  }>;
  recommendedStrike: number;
  riskAnalysis: {
    maxLoss: number;
    breakeven: number;
    profitProbability: number;
  };
}

export interface MarketStatusResponse extends ApiResponse {
  data: {
    market: string;
    serverTime: string;
    exchanges: {
      nasdaq: MarketStatus;
      nyse: MarketStatus;
      otc: MarketStatus;
    };
  };
}

export interface HistoricalDataPoint {
  c: number; // close
  h: number; // high
  l: number; // low
  o: number; // open
  v: number; // volume
  t: number; // timestamp
  vw?: number; // volume weighted average price
  n?: number; // number of transactions
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema20: number;
    ema50: number;
    ema200: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  support: number[];
  resistance: number[];
}

export interface FundamentalData {
  marketCap: number;
  peRatio: number;
  pegRatio: number;
  priceToBook: number;
  debtToEquity: number;
  returnOnEquity: number;
  returnOnAssets: number;
  revenueGrowth: number;
  earningsGrowth: number;
  dividendYield: number;
  payoutRatio: number;
  freeCashFlow: number;
  operatingMargin: number;
  profitMargin: number;
}

// Re-export MarketStatus for convenience
export { MarketStatus };
