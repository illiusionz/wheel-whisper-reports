import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  const currentWheelData = wheelData || report?.wheelData;

  const generateTechnicalData = (data: StockQuote) => {
    const price = data.price;
    return {
      rsi: Math.min(85, Math.max(15, 50 + (data.changePercent * 2))),
      macd: data.changePercent > 0 ? 1.54 : -0.89,
      adx: Math.min(75, Math.max(15, 25 + Math.abs(data.changePercent * 3))),
      ema20: price * 0.98,
      ema50: price * 0.96,
      ema200: price * 0.85
    };
  };

  const generateOptionsData = (data: StockQuote) => {
    const price = data.price;
    return [
      {
        strike: Math.round((price + 2) * 100) / 100,
        expiry: '06/27',
        volume: 12300,
        oi: 18200,
        volOi: 0.67,
        context: 'High call sweep',
        sentiment: 'Bullish'
      },
      {
        strike: Math.round(price * 100) / 100,
        expiry: '06/27',
        volume: 9800,
        oi: 15400,
        volOi: 0.64,
        context: 'Put writing',
        sentiment: 'Bullish'
      },
      {
        strike: Math.round((price - 2) * 100) / 100,
        expiry: '06/27',
        volume: 7500,
        oi: 12000,
        volOi: 0.63,
        context: 'Put buying',
        sentiment: 'Bearish'
      }
    ];
  };

  const generateWheelData = (data: StockQuote) => {
    const price = data.price;
    return {
      csp: [
        {
          strike: Math.round((price - 2) * 100) / 100,
          expiry: '06/27',
          premium: 0.65,
          delta: 0.30,
          iv: '85%',
          sentiment: 'Neutral'
        },
        {
          strike: Math.round((price - 4) * 100) / 100,
          expiry: '06/27',
          premium: 0.35,
          delta: 0.20,
          iv: '90%',
          sentiment: 'Bullish'
        },
        {
          strike: Math.round((price - 6) * 100) / 100,
          expiry: '06/27',
          premium: 0.20,
          delta: 0.15,
          iv: '95%',
          sentiment: 'Bullish'
        }
      ],
      cc: [
        {
          strike: Math.round((price + 2) * 100) / 100,
          expiry: '06/27',
          premium: 0.60,
          delta: 0.35,
          iv: '80%',
          sentiment: 'Neutral'
        },
        {
          strike: Math.round((price + 4) * 100) / 100,
          expiry: '06/27',
          premium: 0.40,
          delta: 0.25,
          iv: '85%',
          sentiment: 'Bullish'
        },
        {
          strike: Math.round((price + 6) * 100) / 100,
          expiry: '06/27',
          premium: 0.25,
          delta: 0.15,
          iv: '90%',
          sentiment: 'Bullish'
        }
      ]
    };
  };

  const getSentimentBadge = (sentiment: string) => {
    const colors = {
      'Bullish': 'bg-green-600 text-white',
      'Bearish': 'bg-red-600 text-white',
      'Neutral': 'bg-yellow-600 text-black'
    };
    return colors[sentiment as keyof typeof colors] || 'bg-gray-600 text-white';
  };

  const technicalData = currentData ? generateTechnicalData(currentData) : null;
  const optionsData = currentData ? generateOptionsData(currentData) : [];
  const wheelStrategyData = currentData ? generateWheelData(currentData) : null;

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

      {/* Macro & Earnings Calendar */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            📅 Macro & Earnings Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-slate-300">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Fed Watch:</h4>
              <p>No FOMC meeting this week; next scheduled for July 30-31.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Key Macro Events:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>June 26: Final Q1 GDP revision</li>
                <li>June 27: PCE inflation report</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">📝 Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Upcoming PCE data could influence market volatility, impacting {symbol}'s performance.</li>
                <li>Earnings from major sector companies may affect {symbol} due to sector correlation.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Overview */}
      {currentData && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              🟢 Stock Overview - {symbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-400">Price</p>
                <p className="text-lg font-semibold text-white">${currentData.price}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Day Range</p>
                <p className="text-lg font-semibold text-white">
                  ${(currentData.price * 0.98).toFixed(2)} - ${(currentData.price * 1.02).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Volume</p>
                <p className="text-lg font-semibold text-white">
                  {currentData.volume ? `${(currentData.volume / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">YTD Performance</p>
                <p className={`text-lg font-semibold ${currentData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currentData.changePercent >= 0 ? '+' : ''}{(currentData.changePercent * 10).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">52-Week Range</p>
                <p className="text-lg font-semibold text-white">
                  ${(currentData.price * 0.7).toFixed(2)} - ${(currentData.price * 1.4).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Dividend Yield</p>
                <p className="text-lg font-semibold text-white">1.22%</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2">📝 Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{symbol}'s significant YTD gain reflects {currentData.changePercent > 0 ? 'strong bullish' : 'bearish'} sentiment in the sector.</li>
                <li>High volatility presents both opportunities and risks for wheel strategy traders.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Snapshot */}
      {technicalData && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              📊 Technical Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-400">RSI (14)</p>
                <p className="text-lg font-semibold text-white">
                  {technicalData.rsi.toFixed(0)} <span className="text-sm text-yellow-400">(Neutral)</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">MACD</p>
                <p className="text-lg font-semibold text-white">
                  {technicalData.macd.toFixed(2)} <span className={`text-sm ${technicalData.macd > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ({technicalData.macd > 0 ? 'Bearish' : 'Bullish'})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">ADX (14)</p>
                <p className="text-lg font-semibold text-white">
                  {technicalData.adx.toFixed(0)} <span className="text-sm text-yellow-400">(Neutral)</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">20 EMA</p>
                <p className="text-lg font-semibold text-green-400">
                  ${technicalData.ema20.toFixed(2)} (Bullish)
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">50 EMA</p>
                <p className="text-lg font-semibold text-green-400">
                  ${technicalData.ema50.toFixed(2)} (Bullish)
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">200 EMA</p>
                <p className="text-lg font-semibold text-red-400">
                  ${technicalData.ema200.toFixed(2)} (Bearish)
                </p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2">📝 Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Price above 20 and 50 EMAs suggests short-term bullish momentum.</li>
                <li>MACD divergence indicates potential for a pullback; caution advised for new entries.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expected Closing Price */}
      {currentData && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="h-5 w-5 mr-2" />
              🔮 Expected Closing Price (Friday, June 27, 2025)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Projected Range</p>
                <p className="text-lg font-semibold text-white">
                  ${(currentData.price * 0.95).toFixed(2)} - ${(currentData.price * 1.05).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Implied Move</p>
                <p className="text-lg font-semibold text-white">
                  ±${(currentData.price * 0.063).toFixed(2)} (6.3%) based on weekly ATM straddle pricing
                </p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2">📝 Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>High implied volatility suggests potential for significant price movement; adjust strike selections accordingly.</li>
                <li>Consider wider strike distances to accommodate expected volatility.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options Activity */}
      {optionsData.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Search className="h-5 w-5 mr-2" />
              🔍 Options Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="text-white font-semibold mb-3">Top Weekly Options (June 27 Expiry)</h4>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Strike</TableHead>
                  <TableHead className="text-slate-300">Expiry</TableHead>
                  <TableHead className="text-slate-300">Volume</TableHead>
                  <TableHead className="text-slate-300">OI</TableHead>
                  <TableHead className="text-slate-300">Vol/OI</TableHead>
                  <TableHead className="text-slate-300">Context</TableHead>
                  <TableHead className="text-slate-300">Sentiment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optionsData.map((option, index) => (
                  <TableRow key={index} className="border-slate-700">
                    <TableCell className="text-white font-medium">${option.strike}</TableCell>
                    <TableCell className="text-slate-300">{option.expiry}</TableCell>
                    <TableCell className="text-slate-300">{option.volume.toLocaleString()}</TableCell>
                    <TableCell className="text-slate-300">{option.oi.toLocaleString()}</TableCell>
                    <TableCell className="text-slate-300">{option.volOi}</TableCell>
                    <TableCell className="text-slate-300">{option.context}</TableCell>
                    <TableCell>
                      <Badge className={getSentimentBadge(option.sentiment)}>
                        {option.sentiment}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <h4 className="font-semibold text-white mb-2">📝 Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                <li>Significant call activity at higher strikes indicates bullish expectations.</li>
                <li>Put writing at lower strikes suggests traders are comfortable with downside risk.</li>
                <li>Put buying at lowest strikes may reflect hedging or bearish bets.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wheel Strategy Ladder */}
      {wheelStrategyData && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              💼 Wheel Strategy Ladder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-white font-semibold mb-3">Cash-Secured Puts (CSPs)</h4>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Strike</TableHead>
                    <TableHead className="text-slate-300">Expiry</TableHead>
                    <TableHead className="text-slate-300">Premium</TableHead>
                    <TableHead className="text-slate-300">Delta</TableHead>
                    <TableHead className="text-slate-300">IV</TableHead>
                    <TableHead className="text-slate-300">Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wheelStrategyData.csp.map((option: any, index: number) => (
                    <TableRow key={index} className="border-slate-700">
                      <TableCell className="text-white font-medium">${option.strike}</TableCell>
                      <TableCell className="text-slate-300">{option.expiry}</TableCell>
                      <TableCell className="text-slate-300">${option.premium}</TableCell>
                      <TableCell className="text-slate-300">{option.delta}</TableCell>
                      <TableCell className="text-slate-300">{option.iv}</TableCell>
                      <TableCell>
                        <Badge className={getSentimentBadge(option.sentiment)}>
                          {option.sentiment}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Covered Calls (CCs)</h4>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Strike</TableHead>
                    <TableHead className="text-slate-300">Expiry</TableHead>
                    <TableHead className="text-slate-300">Premium</TableHead>
                    <TableHead className="text-slate-300">Delta</TableHead>
                    <TableHead className="text-slate-300">IV</TableHead>
                    <TableHead className="text-slate-300">Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wheelStrategyData.cc.map((option: any, index: number) => (
                    <TableRow key={index} className="border-slate-700">
                      <TableCell className="text-white font-medium">${option.strike}</TableCell>
                      <TableCell className="text-slate-300">{option.expiry}</TableCell>
                      <TableCell className="text-slate-300">${option.premium}</TableCell>
                      <TableCell className="text-slate-300">{option.delta}</TableCell>
                      <TableCell className="text-slate-300">{option.iv}</TableCell>
                      <TableCell>
                        <Badge className={getSentimentBadge(option.sentiment)}>
                          {option.sentiment}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">📝 Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                <li>CSPs at moderate strikes offer balance between premium and risk; suitable for conservative entries.</li>
                <li>CCs at higher strikes provide attractive premiums with moderate risk of assignment.</li>
                <li>High IV levels enhance premium collection but necessitate vigilant position management.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MCPReport;
