
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useReportManager } from '@/hooks/useReportManager';
import { RealTimeDataProvider } from '@/contexts/RealTimeDataContext';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { RealTimeErrorBoundary } from '@/components/error/RealTimeErrorBoundary';
import { MarketStatus } from '@/components/ui/market-status';
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
    <ErrorBoundary 
      level="page" 
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        console.error('Dashboard error:', error, errorInfo);
      }}
    >
      <RealTimeErrorBoundary>
        <RealTimeDataProvider>
          <div className="flex h-screen bg-slate-900">
            <ErrorBoundary level="component">
              <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userEmail={user?.email || ''}
                onLogout={signOut}
              />
            </ErrorBoundary>
            
            <main className="flex-1 overflow-auto">
              {/* Market Status Header */}
              <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
                <MarketStatus showMessage={true} />
              </div>
              
              <div className="p-6">
                <ErrorBoundary level="feature">
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
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </RealTimeDataProvider>
      </RealTimeErrorBoundary>
    </ErrorBoundary>
  );
};

export default Dashboard;
