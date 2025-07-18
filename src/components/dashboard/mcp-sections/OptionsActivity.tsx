import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, AlertTriangle, Volume2, Loader2, Zap, Calendar, DollarSign, History } from 'lucide-react';
import { StockQuote } from '@/types/stock';
import { useUnusualOptionsActivity } from '@/hooks/useUnusualOptionsActivity';
import { getStockService } from '@/services/stock';
import WeeklySentimentCard from './WeeklySentimentCard';

interface OptionsActivityProps {
  stockData: StockQuote;
}

const OptionsActivity: React.FC<OptionsActivityProps> = ({ stockData }) => {
  const [activeTab, setActiveTab] = useState('unusual');
  const { 
    data: unusualData, 
    isLoading, 
    error, 
    refresh,
    weeklySentiment,
    historicalData
  } = useUnusualOptionsActivity(stockData.symbol);

  const formatContractName = (ticker: string, strike: number, expiration: string, contractType: 'call' | 'put') => {
    const symbol = ticker.split(/\d/)[0] || stockData.symbol;
    const expiryDate = new Date(expiration);
    const monthDay = expiryDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const typeSymbol = contractType === 'call' ? 'C' : 'P';
    return `${symbol} ${monthDay} $${strike}${typeSymbol}`;
  };

  const formatExpiration = (expiration: string) => {
    const date = new Date(expiration);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysToExpiration = (expiration: string) => {
    const expiryDate = new Date(expiration);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationColor = (daysToExpiry: number) => {
    if (daysToExpiry <= 7) return 'text-red-400';
    if (daysToExpiry <= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Very Bullish':
        return 'bg-green-600 text-white';
      case 'Bullish':
      case 'Moderately Bullish':
        return 'bg-green-500 text-white';
      case 'Very Bearish':
        return 'bg-red-600 text-white';
      case 'Bearish':
      case 'Moderately Bearish':
        return 'bg-red-500 text-white';
      case 'Protective/Hedging':
        return 'bg-yellow-600 text-black';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getVolumeRatioColor = (ratio: number) => {
    if (ratio >= 5) return 'text-red-400 font-bold';
    if (ratio >= 3) return 'text-orange-400 font-semibold';
    if (ratio >= 2) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment.includes('Bullish')) {
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    } else if (sentiment.includes('Bearish')) {
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
  };

  const stockService = getStockService();
  const isUsingRealData = stockService.hasAdvancedFeatures();

  // Separate data by sentiment for analysis
  const bullishActivity = unusualData.filter(item => 
    item.sentiment.includes('Bullish') && item.contractType === 'call'
  );
  const bearishActivity = unusualData.filter(item => 
    item.sentiment.includes('Bearish') && item.contractType === 'put'
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Weekly Sentiment Card */}
        <WeeklySentimentCard weeklySentiment={weeklySentiment} symbol={stockData.symbol} />

        {/* Main Options Activity Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                🔍 Real-time Unusual Options Activity
                {isUsingRealData ? (
                  <Badge variant="outline" className="ml-2 text-blue-400 border-blue-400 text-xs">
                    Live Polygon Data
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-red-400 border-red-400 text-xs">
                    API Required
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {historicalData && historicalData.length > 0 && (
                  <div className="flex items-center text-sm text-blue-400">
                    <History className="h-4 w-4 mr-1" />
                    <span>{historicalData.length} historical records</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Scanning markets...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      <span>{unusualData.length} unusual contracts detected</span>
                    </>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
                  <p className="text-red-400 font-semibold">Data Source Issue</p>
                </div>
                <p className="text-red-300 text-sm">{error}</p>
                {!isUsingRealData && (
                  <div className="mt-3 p-3 bg-blue-900/20 border border-blue-600 rounded">
                    <p className="text-blue-300 text-sm">
                      💡 <strong>Tip:</strong> Configure your Polygon API key in Settings to access real-time unusual options activity detection.
                    </p>
                  </div>
                )}
              </div>
            )}

            {unusualData.length === 0 && !isLoading && !error && (
              <div className="mb-4 p-4 bg-slate-700/30 border border-slate-600 rounded-lg text-center">
                <Volume2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-300 font-semibold">No Unusual Activity Detected</p>
                <p className="text-slate-400 text-sm mt-1">
                  No significant options flow found for {stockData.symbol} at this time.
                </p>
                {isUsingRealData && (
                  <p className="text-slate-500 text-xs mt-2">
                    This indicates normal trading patterns or low options volume.
                  </p>
                )}
              </div>
            )}

            {unusualData.length > 0 && (
              <>
                {/* Quick Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Bullish Signals
                    </h4>
                    <div className="text-2xl font-bold text-white">{bullishActivity.length}</div>
                    <p className="text-slate-300 text-sm">Unusual call activity</p>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="font-semibold text-red-400 mb-2 flex items-center">
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Bearish Signals
                    </h4>
                    <div className="text-2xl font-bold text-white">{bearishActivity.length}</div>
                    <p className="text-slate-300 text-sm">Unusual put activity</p>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="font-semibold text-yellow-400 mb-2 flex items-center">
                      <Volume2 className="h-4 w-4 mr-2" />
                      Peak Volume Ratio
                    </h4>
                    <div className="text-2xl font-bold text-white">
                      {Math.max(...unusualData.map(d => d.volumeRatio), 0).toFixed(1)}x
                    </div>
                    <p className="text-slate-300 text-sm">vs normal volume</p>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-slate-700">
                    <TabsTrigger value="unusual" className="text-white">Current Activity</TabsTrigger>
                    <TabsTrigger value="bullish" className="text-white">Bullish Flow</TabsTrigger>
                    <TabsTrigger value="bearish" className="text-white">Bearish Flow</TabsTrigger>
                    <TabsTrigger value="historical" className="text-white">Historical</TabsTrigger>
                  </TabsList>

                  <TabsContent value="unusual" className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-slate-300">Contract</TableHead>
                            <TableHead className="text-slate-300">Strike</TableHead>
                            <TableHead className="text-slate-300">Expiration</TableHead>
                            <TableHead className="text-slate-300">Volume</TableHead>
                            <TableHead className="text-slate-300">Vol Ratio</TableHead>
                            <TableHead className="text-slate-300">Open Interest</TableHead>
                            <TableHead className="text-slate-300">Premium</TableHead>
                            <TableHead className="text-slate-300">Context</TableHead>
                            <TableHead className="text-slate-300">Sentiment</TableHead>
                            <TableHead className="text-slate-300">AI Analysis</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unusualData.map((item, index) => {
                            const daysToExpiry = getDaysToExpiration(item.expiration);
                            return (
                              <TableRow key={index} className="border-slate-700 hover:bg-slate-700/50">
                                <TableCell className="text-white font-mono text-sm">
                                  {formatContractName(item.ticker, item.strike, item.expiration, item.contractType)}
                                </TableCell>
                                <TableCell className="text-white font-bold flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {item.strike.toFixed(2)}
                                </TableCell>
                                <TableCell className={`font-medium ${getExpirationColor(daysToExpiry)}`}>
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <div>
                                      <div>{formatExpiration(item.expiration)}</div>
                                      <div className="text-xs text-slate-400">{daysToExpiry}d</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-white font-mono">{item.volume.toLocaleString()}</TableCell>
                                <TableCell className={`font-mono ${getVolumeRatioColor(item.volumeRatio)}`}>
                                  {item.volumeRatio.toFixed(1)}x
                                </TableCell>
                                <TableCell className="text-blue-400 font-mono">
                                  {item.openInterest ? item.openInterest.toLocaleString() : 'N/A'}
                                </TableCell>
                                <TableCell className="text-green-400 font-mono">${item.price.toFixed(2)}</TableCell>
                                <TableCell className="text-slate-300 text-sm">{item.context}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    {getSentimentIcon(item.sentiment)}
                                    <Badge className={getSentimentColor(item.sentiment)}>
                                      {item.sentiment}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  {item.aiAnalysis ? (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <div className="text-blue-400 text-xs cursor-help truncate">
                                          {item.aiAnalysis.substring(0, 50)}...
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-sm bg-slate-900 border-slate-700">
                                        <p className="text-sm">{item.aiAnalysis}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span className="text-slate-500 text-xs">No analysis</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="bullish" className="mt-4">
                    <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                      <h4 className="text-green-400 font-semibold mb-2">Bullish Options Flow</h4>
                      <p className="text-slate-300 text-sm">
                        Call buying and bullish positioning indicating upward price expectations.
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-slate-300">Contract</TableHead>
                            <TableHead className="text-slate-300">Strike</TableHead>
                            <TableHead className="text-slate-300">Expiration</TableHead>
                            <TableHead className="text-slate-300">Volume</TableHead>
                            <TableHead className="text-slate-300">Ratio</TableHead>
                            <TableHead className="text-slate-300">Context</TableHead>
                            <TableHead className="text-slate-300">Analysis</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bullishActivity.map((item, index) => {
                            const daysToExpiry = getDaysToExpiration(item.expiration);
                            return (
                              <TableRow key={index} className="border-slate-700 hover:bg-slate-700/50">
                                <TableCell className="text-green-400 font-mono text-sm">
                                  {formatContractName(item.ticker, item.strike, item.expiration, item.contractType)}
                                </TableCell>
                                <TableCell className="text-green-400 font-bold">${item.strike.toFixed(2)}</TableCell>
                                <TableCell className={`font-medium ${getExpirationColor(daysToExpiry)}`}>
                                  <div>
                                    <div>{formatExpiration(item.expiration)}</div>
                                    <div className="text-xs text-slate-400">{daysToExpiry}d</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-white font-mono">{item.volume.toLocaleString()}</TableCell>
                                <TableCell className={`font-mono ${getVolumeRatioColor(item.volumeRatio)}`}>
                                  {item.volumeRatio.toFixed(1)}x
                                </TableCell>
                                <TableCell className="text-slate-300">{item.context}</TableCell>
                                <TableCell className="text-sm text-slate-300 max-w-xs">
                                  {item.aiAnalysis || 'Strong upside positioning'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="bearish" className="mt-4">
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                      <h4 className="text-red-400 font-semibold mb-2">Bearish Options Flow</h4>
                      <p className="text-slate-300 text-sm">
                        Put buying and bearish positioning indicating downside protection or speculation.
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-slate-300">Contract</TableHead>
                            <TableHead className="text-slate-300">Strike</TableHead>
                            <TableHead className="text-slate-300">Expiration</TableHead>
                            <TableHead className="text-slate-300">Volume</TableHead>
                            <TableHead className="text-slate-300">Ratio</TableHead>
                            <TableHead className="text-slate-300">Context</TableHead>
                            <TableHead className="text-slate-300">Analysis</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bearishActivity.map((item, index) => {
                            const daysToExpiry = getDaysToExpiration(item.expiration);
                            return (
                              <TableRow key={index} className="border-slate-700 hover:bg-slate-700/50">
                                <TableCell className="text-red-400 font-mono text-sm">
                                  {formatContractName(item.ticker, item.strike, item.expiration, item.contractType)}
                                </TableCell>
                                <TableCell className="text-red-400 font-bold">${item.strike.toFixed(2)}</TableCell>
                                <TableCell className={`font-medium ${getExpirationColor(daysToExpiry)}`}>
                                  <div>
                                    <div>{formatExpiration(item.expiration)}</div>
                                    <div className="text-xs text-slate-400">{daysToExpiry}d</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-white font-mono">{item.volume.toLocaleString()}</TableCell>
                                <TableCell className={`font-mono ${getVolumeRatioColor(item.volumeRatio)}`}>
                                  {item.volumeRatio.toFixed(1)}x
                                </TableCell>
                                <TableCell className="text-slate-300">{item.context}</TableCell>
                                <TableCell className="text-sm text-slate-300 max-w-xs">
                                  {item.aiAnalysis || 'Downside protection or bearish bet'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="historical" className="mt-4">
                    <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                        <History className="h-4 w-4 mr-2" />
                        Historical Unusual Activity (Last 30 Days)
                      </h4>
                      <p className="text-slate-300 text-sm">
                        Persistent tracking of all detected unusual options activity with trend analysis.
                      </p>
                    </div>
                    
                    {historicalData && historicalData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-700">
                              <TableHead className="text-slate-300">Detected</TableHead>
                              <TableHead className="text-slate-300">Contract</TableHead>
                              <TableHead className="text-slate-300">Volume Ratio</TableHead>
                              <TableHead className="text-slate-300">Sentiment</TableHead>
                              <TableHead className="text-slate-300">Context</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historicalData.slice(0, 20).map((item) => (
                              <TableRow key={item.id} className="border-slate-700 hover:bg-slate-700/50">
                                <TableCell className="text-slate-300 text-sm">
                                  {new Date(item.detectedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </TableCell>
                                <TableCell className="text-white font-mono text-sm">
                                  {formatContractName(item.symbol, item.strike, item.expiration, item.contractType)}
                                </TableCell>
                                <TableCell className={`font-mono ${getVolumeRatioColor(item.volumeRatio)}`}>
                                  {item.volumeRatio.toFixed(1)}x
                                </TableCell>
                                <TableCell>
                                  <Badge className={getSentimentColor(item.sentiment)} variant="outline">
                                    {item.sentiment}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {item.context}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400">No historical data available yet</p>
                        <p className="text-slate-500 text-sm">Activity will be tracked as reports are generated</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="font-semibold text-white mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      🎯 Detection Insights
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                      <li>Volume ratios above 3x indicate significant institutional interest</li>
                      <li>Call sweeps suggest bullish momentum expectations</li>
                      <li>Heavy put activity may indicate hedging or directional bets</li>
                      <li className="text-blue-400">All unusual activity is automatically saved for trend analysis</li>
                      {isUsingRealData ? (
                        <li className="text-blue-400">Real-time detection powered by Polygon API</li>
                      ) : (
                        <li className="text-yellow-400">Configure Polygon API for live unusual activity detection</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <h4 className="font-semibold text-white mb-2 flex items-center">
                      <Volume2 className="h-4 w-4 mr-2" />
                      📊 Activity Metrics
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Current Contracts:</span>
                        <span className="text-white font-mono">{unusualData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Bullish vs Bearish:</span>
                        <span className="text-white font-mono">{bullishActivity.length}:{bearishActivity.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Historical Records:</span>
                        <span className="text-blue-400 font-mono">{historicalData?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Data Source:</span>
                        <span className={`font-mono text-xs ${isUsingRealData ? 'text-blue-400' : 'text-red-400'}`}>
                          {isUsingRealData ? 'Live API' : 'Config Needed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default OptionsActivity;
