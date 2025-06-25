
import React from 'react';
import WatchlistPanel from './WatchlistPanel';
import MCPReport from './MCPReport';
import SchedulePanel from './SchedulePanel';
import SettingsPanel from './SettingsPanel';
import StockProviderSelector from './StockProviderSelector';
import DashboardOverview from './DashboardOverview';

interface DashboardContentProps {
  activeTab: string;
  watchlist: any[];
  reports: {[key: string]: any};
  selectedStock: string | null;
  lastUpdated: Date | null;
  watchlistLoading: boolean;
  isRefreshing: boolean;
  onAddStock: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
  onRefreshReport: () => void;
  onRefreshAll: () => void;
  onRefreshWatchlist: () => void;
  isWatchlistRefreshing: boolean;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  activeTab,
  watchlist,
  reports,
  selectedStock,
  lastUpdated,
  watchlistLoading,
  isRefreshing,
  onAddStock,
  onRemoveStock,
  onSelectStock,
  onRefreshReport,
  onRefreshAll,
  onRefreshWatchlist,
  isWatchlistRefreshing
}) => {
  switch (activeTab) {
    case 'watchlist':
      return (
        <WatchlistPanel
          watchlist={watchlist}
          onAddStock={onAddStock}
          onRemoveStock={onRemoveStock}
          onSelectStock={onSelectStock}
        />
      );
    case 'reports':
      return (
        <MCPReport
          symbol={selectedStock || 'Select a stock'}
          report={selectedStock ? reports[selectedStock] : null}
          onRefresh={onRefreshReport}
          isRefreshing={isRefreshing}
        />
      );
    case 'schedule':
      return (
        <SchedulePanel
          onRefreshAll={onRefreshAll}
          isRefreshing={isRefreshing}
        />
      );
    case 'settings':
      return (
        <div className="space-y-6">
          <StockProviderSelector />
          <SettingsPanel />
        </div>
      );
    default:
      return (
        <DashboardOverview
          watchlist={watchlist}
          reports={reports}
          lastUpdated={lastUpdated}
          watchlistLoading={watchlistLoading}
          onAddStock={onAddStock}
          onRemoveStock={onRemoveStock}
          onSelectStock={onSelectStock}
        />
      );
  }
};

export default DashboardContent;
