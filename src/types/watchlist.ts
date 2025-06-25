
export interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
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

export interface WatchlistOperationResult {
  success: boolean;
  stock?: WatchlistStock;
  error?: string;
}

export interface WatchlistState {
  stocks: WatchlistStock[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isAutoRefreshActive: boolean;
}
