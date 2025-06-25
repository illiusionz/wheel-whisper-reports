
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
