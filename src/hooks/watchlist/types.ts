
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  lastUpdated?: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number | null;
  change_amount: number | null;
  change_percent: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface WatchlistDatabaseOperations {
  fetchWatchlistFromDB(): Promise<{
    symbols: string[];
    watchlist: Stock[];
  }>;
  addStockToDB(symbol: string): Promise<{
    success: boolean;
    stock?: Stock;
    error?: string;
  }>;
  removeStockFromDB(symbol: string): Promise<boolean>;
  updateStockInDB(stockQuotes: import('@/types/stock').StockQuote[]): Promise<void>;
}

export interface WatchlistRealTimeHookProps {
  watchlistSymbols: string[];
  onDataUpdate: (watchlist: Stock[]) => void;
  onDatabaseUpdate: (stockQuotes: import('@/types/stock').StockQuote[]) => void;
}

export interface WatchlistRealTimeReturn {
  isRealTimeLoading: boolean;
  lastUpdated: Date | null;
  isAutoRefreshActive: boolean;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}

export interface WatchlistHookReturn {
  watchlist: Stock[];
  loading: boolean;
  addStock: (symbol: string) => Promise<void>;
  removeStock: (symbol: string) => Promise<void>;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
  isAutoRefreshActive: boolean;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
}
