
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';
import { RealTimeErrorBoundary } from '@/components/error/RealTimeErrorBoundary';
import MCPReportHeader from './mcp-report/MCPReportHeader';
import MCPReportControls from './mcp-report/MCPReportControls';
import MCPReportEmpty from './mcp-report/MCPReportEmpty';
import MCPReportSections from './mcp-report/MCPReportSections';

interface MCPReportProps {
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

const MCPReport: React.FC<MCPReportProps> = ({ symbol, report, onRefresh, isRefreshing }) => {
  const [stockData, setStockData] = useState<StockQuote | null>(null);
  const [wheelData, setWheelData] = useState<any>(null);

  // Use real-time data hook for individual stock updates
  const { 
    data: realTimeStockData,
    isLoading: isRealTimeLoading,
    lastUpdated,
    isAutoRefreshActive,
    startAutoRefresh,
    stopAutoRefresh,
    refresh: refreshRealTimeData,
    retryConnection
  } = useRealTimeData({
    symbol: symbol !== 'Select a stock' ? symbol : undefined,
    refreshInterval: 60000, // 1 minute for detailed reports
    enableAutoRefresh: symbol !== 'Select a stock',
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

  const fetchWheelData = async (stockSymbol: string) => {
    try {
      const stockService = getStockService();
      if (stockService.hasAdvancedFeatures()) {
        const wheelStrategyData = await stockService.getWheelStrategyData(stockSymbol);
        setWheelData(wheelStrategyData);
      }
    } catch (error) {
      console.log('Wheel strategy data not available:', error);
    }
  };

  const handleManualRefresh = async () => {
    await refreshRealTimeData();
    onRefresh();
  };

  const toggleAutoRefresh = () => {
    if (isAutoRefreshActive) {
      stopAutoRefresh();
    } else {
      startAutoRefresh();
    }
  };

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
      {/* Header with Real-time Controls */}
      <RealTimeErrorBoundary onRetry={retryConnection} symbol={symbol}>
        <Card className="bg-slate-800 border-slate-700">
          <MCPReportHeader 
            symbol={symbol}
            lastUpdated={lastUpdated}
            isAutoRefreshActive={isAutoRefreshActive}
          />
          <div className="px-6 pb-6">
            <MCPReportControls
              isAutoRefreshActive={isAutoRefreshActive}
              isRefreshing={isRefreshing}
              isRealTimeLoading={isRealTimeLoading}
              onToggleAutoRefresh={toggleAutoRefresh}
              onManualRefresh={handleManualRefresh}
            />
          </div>
        </Card>
      </RealTimeErrorBoundary>

      {currentData && (
        <MCPReportSections symbol={symbol} stockData={currentData} />
      )}
    </div>
  );
};

export default MCPReport;
