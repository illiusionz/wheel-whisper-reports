
import React from 'react';
import WatchlistPanel from './WatchlistPanel';

interface DashboardOverviewProps {
  watchlist: any[];
  reports: {[key: string]: any};
  lastUpdated: Date | null;
  watchlistLoading: boolean;
  onAddStock: (symbol: string) => void;
  onRemoveStock: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  watchlist,
  reports,
  lastUpdated,
  watchlistLoading,
  onAddStock,
  onRemoveStock,
  onSelectStock
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to WheelTrader Pro</h1>
        <p className="text-slate-300">Your comprehensive MCP Wheel Strategy analytics dashboard</p>
        {lastUpdated && (
          <p className="text-sm text-slate-400 mt-2">
            Watchlist last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Watchlist Stocks</h3>
          <p className="text-3xl font-bold text-green-400">{watchlist.length}</p>
          <p className="text-sm text-slate-400">Active tickers</p>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Generated Reports</h3>
          <p className="text-3xl font-bold text-blue-400">{Object.keys(reports).length}</p>
          <p className="text-sm text-slate-400">This week</p>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Success Rate</h3>
          <p className="text-3xl font-bold text-purple-400">87%</p>
          <p className="text-sm text-slate-400">Strategy accuracy</p>
        </div>
      </div>

      {watchlistLoading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <div className="text-white text-lg">Loading your watchlist...</div>
        </div>
      ) : (
        <WatchlistPanel
          watchlist={watchlist.slice(0, 3)}
          onAddStock={onAddStock}
          onRemoveStock={onRemoveStock}
          onSelectStock={onSelectStock}
        />
      )}
    </div>
  );
};

export default DashboardOverview;
