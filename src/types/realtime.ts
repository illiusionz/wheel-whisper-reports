
export interface RealTimeDataOptions {
  symbol?: string;
  symbols?: string[];
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
  respectMarketHours?: boolean;
  onDataUpdate?: (data: StockQuote | StockQuote[]) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface RealTimeDataState {
  data: StockQuote | StockQuote[] | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isAutoRefreshActive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  marketStatus: MarketStatus;
}

export interface RealTimeSubscription {
  id: string;
  symbols: string[];
  callback: (data: StockQuote[]) => void;
  options: RealTimeDataOptions;
  lastUpdate: Date;
  isActive: boolean;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  lastPing: Date;
  errorCount: number;
  maxErrorCount: number;
}
