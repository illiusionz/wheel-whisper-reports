
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (symbol && symbol !== 'Select a stock') {
      fetchStockData();
    }
  }, [symbol]);

  const fetchStockData = async () => {
    if (!symbol || symbol === 'Select a stock') return;
    
    setLoading(true);
    try {
      const stockService = getStockService();
      const quote = await stockService.getQuote(symbol);
      setStockData(quote);

      if (stockService.hasAdvancedFeatures()) {
        try {
          const wheelStrategyData = await stockService.getWheelStrategyData(symbol);
          setWheelData(wheelStrategyData);
        } catch (error) {
          console.log('Wheel strategy data not available:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
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
                disabled={isRefreshing || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || loading) ? 'animate-spin' : ''}`} />
                {isRefreshing || loading ? 'Loading...' : 'Generate Report'}
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
      {/* Header */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">
                MCP Wheel Strategy Report for {symbol}
              </CardTitle>
              <p className="text-slate-400 mt-1">
                Last updated: {report?.lastUpdated ? new Date(report.lastUpdated).toLocaleString() : 'Just now'}
              </p>
            </div>
            <Button 
              onClick={() => {
                fetchStockData();
                onRefresh();
              }}
              disabled={isRefreshing || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || loading) ? 'animate-spin' : ''}`} />
              {isRefreshing || loading ? 'Refreshing...' : 'Refresh'}
            </Button>
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
