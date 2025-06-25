
import { Stock } from '@/hooks/watchlist/types';
import { MCPReportData } from './reports';

export interface DashboardTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface DashboardState {
  activeTab: string;
  selectedStock: string | null;
  watchlist: Stock[];
  reports: Record<string, MCPReportData>;
  lastUpdated: Date | null;
  loading: {
    watchlist: boolean;
    reports: boolean;
    general: boolean;
  };
  refreshing: {
    reports: boolean;
    watchlist: boolean;
  };
}

export interface DashboardActions {
  setActiveTab: (tab: string) => void;
  setSelectedStock: (symbol: string | null) => void;
  addStock: (symbol: string) => Promise<void>;
  removeStock: (symbol: string) => Promise<void>;
  selectStock: (symbol: string) => void;
  refreshReport: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export interface DashboardContentProps {
  activeTab: string;
  watchlist: Stock[];
  reports: Record<string, MCPReportData>;
  selectedStock: string | null;
  lastUpdated: Date | null;
  watchlistLoading: boolean;
  isRefreshing: boolean;
  onAddStock: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
  onRefreshReport: () => void;
  onRefreshAll: () => void;
}

export interface WatchlistPanelProps {
  watchlist: Stock[];
  onAddStock: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
}

export interface MCPReportProps {
  symbol: string;
  report: MCPReportData | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}
