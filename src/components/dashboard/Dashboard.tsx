
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import Sidebar from './Sidebar';
import WatchlistPanel from './WatchlistPanel';
import MCPReport from './MCPReport';
import SchedulePanel from './SchedulePanel';
import SettingsPanel from './SettingsPanel';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { watchlist, loading: watchlistLoading, addStock, removeStock } = useWatchlist();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [reports, setReports] = useState<{[key: string]: any}>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddStock = (symbol: string) => {
    addStock(symbol);
  };

  const handleRemoveStock = (symbol: string) => {
    removeStock(symbol);
    // Remove associated report
    setReports(prev => {
      const newReports = { ...prev };
      delete newReports[symbol];
      return newReports;
    });
    if (selectedStock === symbol) {
      setSelectedStock(null);
    }
  };

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
    setActiveTab('reports');
  };

  const handleRefreshReport = (symbol?: string) => {
    setIsRefreshing(true);
    
    // Simulate API call to generate report
    setTimeout(() => {
      const targetSymbol = symbol || selectedStock;
      if (targetSymbol) {
        setReports(prev => ({
          ...prev,
          [targetSymbol]: {
            lastUpdated: new Date().toISOString(),
            sections: {
              // Mock report data - would come from actual GPT generation
              macroCalendar: {},
              stockOverview: {},
              technicalSnapshot: {},
              expectedClosing: {},
              optionsActivity: {},
              wheelLadder: {},
              executionTiming: {},
              fundamentals: {},
              capitalFlows: {},
              volatilitySentiment: {},
              newsCatalysts: {},
              sectorAnalysis: {},
              confidenceLevel: {}
            }
          }
        }));
      }
      setIsRefreshing(false);
    }, 2000);
  };

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    // Simulate refreshing all reports
    setTimeout(() => {
      const newReports: {[key: string]: any} = {};
      watchlist.forEach(stock => {
        newReports[stock.symbol] = {
          lastUpdated: new Date().toISOString(),
          sections: {}
        };
      });
      setReports(newReports);
      setIsRefreshing(false);
    }, 3000);
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'watchlist':
        return (
          <WatchlistPanel
            watchlist={watchlist}
            onAddStock={handleAddStock}
            onRemoveStock={handleRemoveStock}
            onSelectStock={handleSelectStock}
          />
        );
      case 'reports':
        return (
          <MCPReport
            symbol={selectedStock || 'Select a stock'}
            report={selectedStock ? reports[selectedStock] : null}
            onRefresh={() => handleRefreshReport()}
            isRefreshing={isRefreshing}
          />
        );
      case 'schedule':
        return (
          <SchedulePanel
            onRefreshAll={handleRefreshAll}
            isRefreshing={isRefreshing}
          />
        );
      case 'settings':
        return <SettingsPanel />;
      default:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-lg p-6">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to WheelTrader Pro</h1>
              <p className="text-slate-300">Your comprehensive MCP Wheel Strategy analytics dashboard</p>
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
                onAddStock={handleAddStock}
                onRemoveStock={handleRemoveStock}
                onSelectStock={handleSelectStock}
              />
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userEmail={user?.email || ''}
        onLogout={signOut}
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderActivePanel()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
