
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw, Pause, Play } from 'lucide-react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';
import MacroCalendar from './mcp-sections/MacroCalendar';
import StockOverview from './mcp-sections/StockOverview';
import TechnicalSnapshot from './mcp-sections/TechnicalSnapshot';
import ExpectedClosing from './mcp-sections/ExpectedClosing';
import OptionsActivity from './mcp-sections/OptionsActivity';
import WheelStrategyLadder from './mcp-sections/WheelStrategyLadder';

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
    refresh: refreshRealTimeData
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
      <div className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>MCP Report for {symbol}</span>
              <Button 
                onClick={onRefresh}
                disabled={isRefreshing || isRealTimeLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isRealTimeLoading) ? 'animate-spin' : ''}`} />
                {isRefreshing || isRealTimeLoading ? 'Loading...' : 'Generate Report'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Report Available</h3>
            <p className="text-slate-400 mb-4">Generate your first MCP Wheel Strategy Report for {symbol}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentData = stockData || report?.stockData;

  return (
    <div className="space-y-6">
      {/* Header with Real-time Controls */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">
                MCP Wheel Strategy Report for {symbol}
              </CardTitle>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-slate-400">
                  Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                </p>
                {isAutoRefreshActive && (
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={toggleAutoRefresh}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {isAutoRefreshActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Auto-Refresh
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Auto-Refresh
                  </>
                )}
              </Button>
              <Button 
                onClick={handleManualRefresh}
                disabled={isRefreshing || isRealTimeLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isRealTimeLoading) ? 'animate-spin' : ''}`} />
                {isRefreshing || isRealTimeLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <MacroCalendar symbol={symbol} />

      {currentData && (
        <>
          <StockOverview symbol={symbol} stockData={currentData} />
          <TechnicalSnapshot stockData={currentData} />
          <ExpectedClosing stockData={currentData} />
          <OptionsActivity stockData={currentData} />
          <WheelStrategyLadder stockData={currentData} />
        </>
      )}
    </div>
  );
};

export default MCPReport;
