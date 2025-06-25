
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: string;
}

export interface StockProvider {
  name: string;
  getQuote(symbol: string): Promise<StockQuote>;
  getMultipleQuotes(symbols: string[]): Promise<StockQuote[]>;
  isConfigured(): boolean;
}

export interface StockServiceConfig {
  provider: 'finnhub' | 'alpha-vantage' | 'polygon' | 'mock';
  apiKey?: string;
  fallbackProvider?: 'finnhub' | 'alpha-vantage' | 'polygon' | 'mock';
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
}

export interface WheelStrategyData {
  currentPrice: number;
  volatility: number;
  suitablePutStrikes: Array<{
    strike: number;
    expiration: string;
    ticker: string;
  }>;
  recommendedStrike: number;
}

export interface MarketStatus {
  market: string;
  serverTime: string;
  exchanges: {
    nasdaq: string;
    nyse: string;
    otc: string;
  };
}

export interface HistoricalDataPoint {
  c: number; // close
  h: number; // high
  l: number; // low
  o: number; // open
  v: number; // volume
  t: number; // timestamp
}
