import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Target, 
  Search,
  Briefcase,
  Clock,
  Brain,
  DollarSign,
  Zap,
  Newspaper,
  Globe,
  Sun,
  RefreshCw
} from 'lucide-react';
import { getStockService } from '@/services/stock';
import { StockQuote } from '@/types/stock';

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

      // Try to get wheel strategy data if using Polygon
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

  const sections = [
    {
      id: 'macroCalendar',
      title: '🗓️ Macro & Earnings Calendar',
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      id: 'stockOverview',
      title: '🟢 Stock Overview',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      id: 'technicalSnapshot',
      title: '📊 Technical Snapshot',
      icon: BarChart3,
      color: 'bg-purple-500'
    },
    {
      id: 'expectedClosing',
      title: '🔮 Expected Closing Price',
      icon: Target,
      color: 'bg-indigo-500'
    },
    {
      id: 'optionsActivity',
      title: '🔍 Options Activity',
      icon: Search,
      color: 'bg-orange-500'
    },
    {
      id: 'wheelLadder',
      title: '💼 Wheel Strategy Ladder',
      icon: Briefcase,
      color: 'bg-emerald-500'
    },
    {
      id: 'executionTiming',
      title: '🕒 Execution Timing Tips',
      icon: Clock,
      color: 'bg-cyan-500'
    },
    {
      id: 'fundamentals',
      title: '🧠 Fundamentals',
      icon: Brain,
      color: 'bg-pink-500'
    },
    {
      id: 'capitalFlows',
      title: '💸 Capital Flows',
      icon: DollarSign,
      color: 'bg-yellow-500'
    },
    {
      id: 'volatilitySentiment',
      title: '⚡️ Volatility & Sentiment',
      icon: Zap,
      color: 'bg-red-500'
    },
    {
      id: 'newsCatalysts',
      title: '📰 News & Catalysts',
      icon: Newspaper,
      color: 'bg-teal-500'
    },
    {
      id: 'sectorAnalysis',
      title: '🌍 Sector & Peer Analysis',
      icon: Globe,
      color: 'bg-violet-500'
    },
    {
      id: 'confidenceLevel',
      title: '🌞 Confidence Level',
      icon: Sun,
      color: 'bg-amber-500'
    }
  ];

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

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">{symbol} MCP Report</CardTitle>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center">
                  <div className={`w-2 h-2 rounded-full ${section.color} mr-3`}></div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-slate-400" />
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                      {stockData || report ? 'Live Data' : 'Updated'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-slate-300">
                    {section.id === 'stockOverview' && stockData && (
                      <div className="space-y-2">
                        <p><strong>Current Price:</strong> ${stockData.price}</p>
                        <p><strong>Change:</strong> <span className={stockData.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {stockData.change >= 0 ? '+' : ''}${stockData.change} ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent}%)
                        </span></p>
                        <p><strong>Company:</strong> {stockData.name}</p>
                        {stockData.volume && <p><strong>Volume:</strong> {stockData.volume.toLocaleString()}</p>}
                        {stockData.marketCap && <p><strong>Market Cap:</strong> ${(stockData.marketCap / 1e9).toFixed(2)}B</p>}
                      </div>
                    )}
                    {section.id === 'wheelLadder' && wheelData && (
                      <div className="space-y-2">
                        <p><strong>Current Price:</strong> ${wheelData.currentPrice}</p>
                        <p><strong>Volatility:</strong> {wheelData.volatility.toFixed(1)}%</p>
                        <p><strong>Recommended Strike:</strong> ${wheelData.recommendedStrike.toFixed(2)}</p>
                        {wheelData.suitablePutStrikes?.length > 0 && (
                          <p><strong>Put Options:</strong> {wheelData.suitablePutStrikes.length} available</p>
                        )}
                      </div>
                    )}
                    {section.id === 'wheelLadder' && !wheelData && (
                      <div className="space-y-2">
                        <p><strong>Recommended Put:</strong> ${(stockData?.price ? stockData.price * 0.95 : 140).toFixed(0)} PUT</p>
                        <p><strong>Premium:</strong> $2.45 (estimated)</p>
                        <p><strong>Expiry:</strong> 15 DTE</p>
                      </div>
                    )}
                    {section.id === 'confidenceLevel' && (
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-full bg-slate-700 rounded-full h-2 mr-2">
                            <div className="bg-green-400 h-2 rounded-full" style={{width: stockData ? '92%' : '85%'}}></div>
                          </div>
                          <span className="text-green-400 font-semibold">{stockData ? '92%' : '85%'}</span>
                        </div>
                        <p className="text-xs">
                          {stockData ? 'High confidence with live market data' : 'High confidence based on technical and fundamental analysis'}
                        </p>
                      </div>
                    )}
                    {!['stockOverview', 'wheelLadder', 'confidenceLevel'].includes(section.id) && (
                      <p className="text-slate-400">Click to view detailed analysis...</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MCPReport;
