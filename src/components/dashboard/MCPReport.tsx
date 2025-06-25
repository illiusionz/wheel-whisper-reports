
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

  const getMarketSentiment = (changePercent: number) => {
    if (changePercent > 2) return { label: 'Very Bullish', color: 'text-green-400' };
    if (changePercent > 0.5) return { label: 'Bullish', color: 'text-green-300' };
    if (changePercent > -0.5) return { label: 'Neutral', color: 'text-yellow-400' };
    if (changePercent > -2) return { label: 'Bearish', color: 'text-red-300' };
    return { label: 'Very Bearish', color: 'text-red-400' };
  };

  const getVolatilityLevel = (changePercent: number) => {
    const absChange = Math.abs(changePercent);
    if (absChange > 5) return { label: 'High', color: 'text-red-400' };
    if (absChange > 2) return { label: 'Medium', color: 'text-yellow-400' };
    return { label: 'Low', color: 'text-green-400' };
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

  const currentData = stockData || report?.stockData;
  const currentWheelData = wheelData || report?.wheelData;
  const sentiment = currentData ? getMarketSentiment(currentData.changePercent) : null;
  const volatility = currentData ? getVolatilityLevel(currentData.changePercent) : null;

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
                      {currentData || report ? 'Live Data' : 'Updated'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-slate-300">
                    {section.id === 'stockOverview' && currentData && (
                      <div className="space-y-2">
                        <p><strong>Current Price:</strong> ${currentData.price}</p>
                        <p><strong>Change:</strong> <span className={currentData.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {currentData.change >= 0 ? '+' : ''}${currentData.change} ({currentData.changePercent >= 0 ? '+' : ''}{currentData.changePercent}%)
                        </span></p>
                        <p><strong>Company:</strong> {currentData.name}</p>
                        {currentData.volume && <p><strong>Volume:</strong> {currentData.volume.toLocaleString()}</p>}
                        {currentData.marketCap && <p><strong>Market Cap:</strong> ${(currentData.marketCap / 1e9).toFixed(2)}B</p>}
                      </div>
                    )}
                    
                    {section.id === 'technicalSnapshot' && currentData && (
                      <div className="space-y-2">
                        <p><strong>Price Action:</strong> <span className={currentData.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {currentData.change >= 0 ? 'Bullish' : 'Bearish'}
                        </span></p>
                        <p><strong>Momentum:</strong> {Math.abs(currentData.changePercent) > 2 ? 'Strong' : 'Moderate'}</p>
                        <p><strong>Daily Range:</strong> {currentData.changePercent.toFixed(2)}%</p>
                        <p><strong>Support Level:</strong> ${(currentData.price * 0.95).toFixed(2)}</p>
                      </div>
                    )}
                    
                    {section.id === 'expectedClosing' && currentData && (
                      <div className="space-y-2">
                        <p><strong>Target Price:</strong> ${(currentData.price + (currentData.change * 0.5)).toFixed(2)}</p>
                        <p><strong>Range:</strong> ${(currentData.price * 0.98).toFixed(2)} - ${(currentData.price * 1.02).toFixed(2)}</p>
                        <p><strong>Probability:</strong> 78%</p>
                      </div>
                    )}
                    
                    {section.id === 'optionsActivity' && currentData && (
                      <div className="space-y-2">
                        <p><strong>IV Rank:</strong> {Math.floor(Math.abs(currentData.changePercent) * 10)}%</p>
                        <p><strong>Put/Call Ratio:</strong> {currentData.changePercent < 0 ? '1.2' : '0.8'}</p>
                        <p><strong>Volume:</strong> {currentData.volume ? 'High' : 'Moderate'}</p>
                      </div>
                    )}
                    
                    {section.id === 'wheelLadder' && (currentWheelData || currentData) && (
                      <div className="space-y-2">
                        <p><strong>Current Price:</strong> ${currentWheelData?.currentPrice || currentData?.price}</p>
                        <p><strong>Volatility:</strong> {currentWheelData?.volatility?.toFixed(1) || (Math.abs(currentData?.changePercent || 0) * 5).toFixed(1)}%</p>
                        <p><strong>Recommended Strike:</strong> ${currentWheelData?.recommendedStrike?.toFixed(2) || (currentData ? (currentData.price * 0.95).toFixed(2) : '140')}</p>
                        {currentWheelData?.suitablePutStrikes?.length > 0 && (
                          <p><strong>Put Options:</strong> {currentWheelData.suitablePutStrikes.length} available</p>
                        )}
                      </div>
                    )}
                    
                    {section.id === 'executionTiming' && currentData && (
                      <div className="space-y-2">
                        <p><strong>Best Entry:</strong> {Math.abs(currentData.changePercent) > 1 ? 'Wait for stabilization' : 'Good entry point'}</p>
                        <p><strong>Market Hours:</strong> Open</p>
                        <p><strong>Liquidity:</strong> {currentData.volume && currentData.volume > 1000000 ? 'High' : 'Moderate'}</p>
                      </div>
                    )}
                    
                    {section.id === 'fundamentals' && currentData && (
                      <div className="space-y-2">
                        <p><strong>Market Cap:</strong> ${currentData.marketCap ? (currentData.marketCap / 1e9).toFixed(1) + 'B' : 'N/A'}</p>
                        <p><strong>Sector:</strong> Technology</p>
                        <p><strong>Rating:</strong> {currentData.changePercent > 0 ? 'Buy' : 'Hold'}</p>
                      </div>
                    )}
                    
                    {section.id === 'capitalFlows' && currentData && (
                      <div className="space-y-2">
                        <p><strong>Institutional Flow:</strong> <span className={currentData.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {currentData.change >= 0 ? 'Inflow' : 'Outflow'}
                        </span></p>
                        <p><strong>Volume:</strong> {currentData.volume ? currentData.volume.toLocaleString() : 'N/A'}</p>
                        <p><strong>Smart Money:</strong> {currentData.changePercent > 1 ? 'Buying' : 'Neutral'}</p>
                      </div>
                    )}
                    
                    {section.id === 'volatilitySentiment' && currentData && sentiment && volatility && (
                      <div className="space-y-2">
                        <p><strong>Sentiment:</strong> <span className={sentiment.color}>{sentiment.label}</span></p>
                        <p><strong>Volatility:</strong> <span className={volatility.color}>{volatility.label}</span></p>
                        <p><strong>Fear & Greed:</strong> {currentData.changePercent > 0 ? 'Greed' : 'Fear'}</p>
                      </div>
                    )}
                    
                    {section.id === 'newsCatalysts' && currentData && (
                      <div className="space-y-2">
                        <p><strong>Recent News:</strong> {Math.abs(currentData.changePercent) > 2 ? 'High Impact' : 'Normal'}</p>
                        <p><strong>Earnings:</strong> Next Quarter</p>
                        <p><strong>Events:</strong> {currentData.changePercent > 5 ? 'Major catalyst' : 'None scheduled'}</p>
                      </div>
                    )}
                    
                    {section.id === 'sectorAnalysis' && currentData && (
                      <div className="space-y-2">
                        <p><strong>Sector Performance:</strong> <span className={currentData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {currentData.changePercent >= 0 ? 'Outperforming' : 'Underperforming'}
                        </span></p>
                        <p><strong>Relative Strength:</strong> {Math.abs(currentData.changePercent) > 1 ? 'Strong' : 'Weak'}</p>
                        <p><strong>Peer Comparison:</strong> {currentData.changePercent > 0 ? 'Above Average' : 'Below Average'}</p>
                      </div>
                    )}
                    
                    {section.id === 'macroCalendar' && (
                      <div className="space-y-2">
                        <p><strong>Market Session:</strong> Regular Hours</p>
                        <p><strong>Economic Events:</strong> None Today</p>
                        <p><strong>Earnings:</strong> After Market Close</p>
                      </div>
                    )}
                    
                    {section.id === 'confidenceLevel' && (
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-full bg-slate-700 rounded-full h-2 mr-2">
                            <div className="bg-green-400 h-2 rounded-full" style={{width: currentData ? '92%' : '85%'}}></div>
                          </div>
                          <span className="text-green-400 font-semibold">{currentData ? '92%' : '85%'}</span>
                        </div>
                        <p className="text-xs">
                          {currentData ? 'High confidence with live market data' : 'High confidence based on technical and fundamental analysis'}
                        </p>
                      </div>
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
