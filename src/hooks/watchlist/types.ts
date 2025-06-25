
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
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
}
