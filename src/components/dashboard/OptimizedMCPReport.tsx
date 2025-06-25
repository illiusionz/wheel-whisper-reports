
import React, { useEffect, useState, memo } from 'react';
import { Card } from '@/components/ui/card';
import { useOptimizedRealTimeData } from '@/hooks/useOptimizedRealTimeData';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';
import { RealTimeErrorBoundary } from '@/components/error/RealTimeErrorBoundary';
import MCPReportHeader from './mcp-report/MCPReportHeader';
import MCPReportControls from './mcp-report/MCPReportControls';
import MCPReportEmpty from './mcp-report/MCPReportEmpty';
import OptimizedMCPReportSections from './mcp-report/OptimizedMCPReportSections';

interface OptimizedMCPReportProps {
  symbol: string;
  report: MCPReportData | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

interface MCPReportData {
  lastUpdated: string;
  stockData?: StockQuote;
  wheelData?: any;
  sections: {
    macroCalendar: any;
    stockOverview: any;
    technicalSnapshot: any;
    expectedClosing: any;
    optionsActivity: any;
    wheelLadder: any;
    executionTiming: any;
    fundamentals: any;
    capitalFlows: any;
    volatilitySentiment: any;
    newsCatalysts: any;
    sectorAnalysis: any;
    confidenceLevel: any;
  };
}

const OptimizedMCPReport: React.FC<OptimizedMCPReportProps> = memo(({ 
  symbol, 
  report, 
  onRefresh, 
  isRefreshing 
}) => {
  const [stockData, setStockData] = useState<StockQuote | null>(null);
  const [wheelData, setWheelData] = useState<any>(null);
  
  const {
    metrics,
    startRenderTiming,
    endRenderTiming,
    trackApiCall
  } = usePerformanceMonitor('OptimizedMCPReport');

  // Start render timing
  useEffect(() => {
    startRenderTiming();
    return () => endRenderTiming();
  });

  // Optimized real-time data hook - manual refresh only
  const { 
    data: realTimeStockData,
    isLoading: isRealTimeLoading,
    lastUpdated,
    refresh: refreshRealTimeData,
    retryConnection
  } = useOptimizedRealTimeData({
    symbol: symbol !== 'Select a stock' ? symbol : undefined,
    enableAutoRefresh: false, // Disabled auto-refresh
    onDataUpdate: (data) => {
      if (!Array.isArray(data)) {
        setStockData(data);
        fetchWheelData(data.symbol);
      }
    },
    onError: (error) => {
      console.error('Real-time report update failed:', error);
    }
  });

  const fetchWheelData = React.useCallback(async (stockSymbol: string) => {
    try {
      trackApiCall();
      const stockService = getStockService();
      if (stockService.hasAdvancedFeatures()) {
        const wheelStrategyData = await stockService.getWheelStrategyData(stockSymbol);
        setWheelData(wheelStrategyData);
      }
    } catch (error) {
      console.log('Wheel strategy data not available:', error);
    }
  }, [trackApiCall]);

  const handleManualRefresh = React.useCallback(async () => {
    await refreshRealTimeData();
    onRefresh();
  }, [refreshRealTimeData, onRefresh]);

  if (!report && !stockData) {
    return (
      <MCPReportEmpty 
        symbol={symbol}
        isRefreshing={isRefreshing}
        isRealTimeLoading={isRealTimeLoading}
        onRefresh={onRefresh}
      />
    );
  }

  const currentData = stockData || report?.stockData;

  return (
    <div className="space-y-6">
      {/* Performance metrics in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-slate-400 p-2 bg-slate-900 rounded">
          Render: {metrics.renderTime.toFixed(2)}ms | 
          API calls: {metrics.apiCallCount} | 
          Cache hit rate: {metrics.cacheHitRate.toFixed(1)}%
        </div>
      )}

      {/* Header with Manual Refresh Controls */}
      <RealTimeErrorBoundary onRetry={retryConnection} symbol={symbol}>
        <Card className="bg-slate-800 border-slate-700">
          <MCPReportHeader 
            symbol={symbol}
            lastUpdated={lastUpdated}
          />
          <div className="px-6 pb-6">
            <MCPReportControls
              isRefreshing={isRefreshing}
              isRealTimeLoading={isRealTimeLoading}
              onManualRefresh={handleManualRefresh}
            />
          </div>
        </Card>
      </RealTimeErrorBoundary>

      {currentData && (
        <OptimizedMCPReportSections symbol={symbol} stockData={currentData} />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.symbol === nextProps.symbol &&
    prevProps.isRefreshing === nextProps.isRefreshing &&
    prevProps.report?.lastUpdated === nextProps.report?.lastUpdated
  );
});

OptimizedMCPReport.displayName = 'OptimizedMCPReport';

export default OptimizedMCPReport;
