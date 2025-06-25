
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useReportManager } from '@/hooks/useReportManager';
import { RealTimeDataProvider } from '@/contexts/RealTimeDataContext';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { watchlist, loading: watchlistLoading, addStock, removeStock, lastUpdated } = useWatchlist();
  const { reports, isRefreshing, handleRefreshReport, handleRefreshAll, removeReport } = useReportManager();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const handleAddStock = (symbol: string) => {
    addStock(symbol);
  };

  const handleRemoveStock = (symbol: string) => {
    removeStock(symbol);
    removeReport(symbol);
    if (selectedStock === symbol) {
      setSelectedStock(null);
    }
  };

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
    setActiveTab('reports');
  };

  const handleRefreshReportWrapper = async () => {
    await handleRefreshReport(undefined, selectedStock);
  };

  const handleRefreshAllWrapper = async () => {
    await handleRefreshAll(watchlist);
  };

  return (
    <RealTimeDataProvider>
      <div className="flex h-screen bg-slate-900">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userEmail={user?.email || ''}
          onLogout={signOut}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <DashboardContent
              activeTab={activeTab}
              watchlist={watchlist}
              reports={reports}
              selectedStock={selectedStock}
              lastUpdated={lastUpdated}
              watchlistLoading={watchlistLoading}
              isRefreshing={isRefreshing}
              onAddStock={handleAddStock}
              onRemoveStock={handleRemoveStock}
              onSelectStock={handleSelectStock}
              onRefreshReport={handleRefreshReportWrapper}
              onRefreshAll={handleRefreshAllWrapper}
            />
          </div>
        </main>
      </div>
    </RealTimeDataProvider>
  );
};

export default Dashboard;
