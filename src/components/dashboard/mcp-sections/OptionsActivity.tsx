
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Clock, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { StockQuote } from '@/types/stock';

interface OptionsActivityProps {
  stockData: StockQuote;
}

interface OptionData {
  strike: number;
  expiry: string;
  volume: number;
  oi: number;
  volOi: number;
  context: string;
  sentiment: string;
  premium: number;
  lastTradeTime: string;
  volumeDistribution: {
    preMarket: number;
    regular: number;
    afterHours: number;
  };
  wheelSuitability: 'excellent' | 'good' | 'fair' | 'poor';
  probabilityITM: number;
  annualizedReturn: number;
}

const OptionsActivity: React.FC<OptionsActivityProps> = ({ stockData }) => {
  const [activeTab, setActiveTab] = useState('all');

  const generateOptionsData = (data: StockQuote): OptionData[] => {
    const price = data.price;
    const currentTime = new Date();
    
    return [
      {
        strike: Math.round((price + 2) * 100) / 100,
        expiry: '06/27',
        volume: 12300,
        oi: 18200,
        volOi: 0.67,
        context: 'High call sweep',
        sentiment: 'Bullish',
        premium: 1.85,
        lastTradeTime: '2:45 PM',
        volumeDistribution: { preMarket: 15, regular: 70, afterHours: 15 },
        wheelSuitability: 'poor',
        probabilityITM: 75,
        annualizedReturn: 8.2
      },
      {
        strike: Math.round(price * 100) / 100,
        expiry: '06/27',
        volume: 9800,
        oi: 15400,
        volOi: 0.64,
        context: 'Put writing',
        sentiment: 'Bullish',
        premium: 2.40,
        lastTradeTime: '3:12 PM',
        volumeDistribution: { preMarket: 10, regular: 80, afterHours: 10 },
        wheelSuitability: 'excellent',
        probabilityITM: 45,
        annualizedReturn: 24.8
      },
      {
        strike: Math.round((price - 2) * 100) / 100,
        expiry: '06/27',
        volume: 7500,
        oi: 12000,
        volOi: 0.63,
        context: 'Put buying',
        sentiment: 'Bearish',
        premium: 3.20,
        lastTradeTime: '1:30 PM',
        volumeDistribution: { preMarket: 5, regular: 85, afterHours: 10 },
        wheelSuitability: 'good',
        probabilityITM: 25,
        annualizedReturn: 18.5
      },
      {
        strike: Math.round((price - 5) * 100) / 100,
        expiry: '07/11',
        volume: 4200,
        oi: 8500,
        volOi: 0.49,
        context: 'Protective puts',
        sentiment: 'Defensive',
        premium: 1.95,
        lastTradeTime: '11:45 AM',
        volumeDistribution: { preMarket: 20, regular: 65, afterHours: 15 },
        wheelSuitability: 'good',
        probabilityITM: 15,
        annualizedReturn: 12.3
      }
    ];
  };

  const getSentimentBadge = (sentiment: string) => {
    const colors = {
      'Bullish': 'bg-green-600 text-white',
      'Bearish': 'bg-red-600 text-white',
      'Defensive': 'bg-yellow-600 text-black',
      'Neutral': 'bg-gray-600 text-white'
    };
    return colors[sentiment as keyof typeof colors] || 'bg-gray-600 text-white';
  };

  const getWheelSuitabilityBadge = (suitability: string) => {
    const colors = {
      'excellent': 'bg-emerald-500 text-white',
      'good': 'bg-blue-500 text-white',
      'fair': 'bg-orange-500 text-white',
      'poor': 'bg-red-500 text-white'
    };
    return colors[suitability as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const optionsData = generateOptionsData(stockData);
  const wheelSuitableOptions = optionsData.filter(opt => 
    opt.wheelSuitability === 'excellent' || opt.wheelSuitability === 'good'
  );
  const putOptions = optionsData.filter(opt => opt.context.includes('Put') || opt.context.includes('put'));

  const VolumeDistributionBar = ({ distribution }: { distribution: { preMarket: number; regular: number; afterHours: number } }) => (
    <div className="flex w-full h-3 bg-gray-700 rounded-sm overflow-hidden">
      <div 
        className="bg-blue-400" 
        style={{ width: `${distribution.preMarket}%` }}
        title={`Pre-market: ${distribution.preMarket}%`}
      />
      <div 
        className="bg-green-400" 
        style={{ width: `${distribution.regular}%` }}
        title={`Regular: ${distribution.regular}%`}
      />
      <div 
        className="bg-purple-400" 
        style={{ width: `${distribution.afterHours}%` }}
        title={`After-hours: ${distribution.afterHours}%`}
      />
    </div>
  );

  return (
    <TooltipProvider>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              🔍 Options Activity
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <Clock className="h-4 w-4" />
              <span>Real-time data</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700">
              <TabsTrigger value="all" className="text-white">All Options</TabsTrigger>
              <TabsTrigger value="wheel" className="text-white">Wheel Opportunities</TabsTrigger>
              <TabsTrigger value="puts" className="text-white">Put Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Strike</TableHead>
                      <TableHead className="text-slate-300">Expiry</TableHead>
                      <TableHead className="text-slate-300">Volume</TableHead>
                      <TableHead className="text-slate-300">Premium</TableHead>
                      <TableHead className="text-slate-300">Last Trade</TableHead>
                      <TableHead className="text-slate-300">Volume Timing</TableHead>
                      <TableHead className="text-slate-300">Context</TableHead>
                      <TableHead className="text-slate-300">Sentiment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optionsData.map((option, index) => (
                      <TableRow key={index} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white font-medium">${option.strike}</TableCell>
                        <TableCell className="text-slate-300">{option.expiry}</TableCell>
                        <TableCell className="text-slate-300 font-mono">{option.volume.toLocaleString()}</TableCell>
                        <TableCell className="text-green-400 font-mono">${option.premium}</TableCell>
                        <TableCell className="text-slate-300 text-sm">{option.lastTradeTime}</TableCell>
                        <TableCell className="w-24">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <VolumeDistributionBar distribution={option.volumeDistribution} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 border-slate-700">
                              <div className="text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                                  <span>Pre-market: {option.volumeDistribution.preMarket}%</span>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                                  <span>Regular: {option.volumeDistribution.regular}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-purple-400 rounded-sm"></div>
                                  <span>After-hours: {option.volumeDistribution.afterHours}%</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">{option.context}</TableCell>
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
            </TabsContent>

            <TabsContent value="wheel" className="mt-4">
              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Wheel Strategy Opportunities
                </h4>
                <p className="text-slate-300 text-sm">
                  Focused on cash-secured puts with good premium and manageable risk for wheel trading.
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Strike</TableHead>
                      <TableHead className="text-slate-300">Premium</TableHead>
                      <TableHead className="text-slate-300">Wheel Rating</TableHead>
                      <TableHead className="text-slate-300">ITM Probability</TableHead>
                      <TableHead className="text-slate-300">Annual Return</TableHead>
                      <TableHead className="text-slate-300">Volume Timing</TableHead>
                      <TableHead className="text-slate-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wheelSuitableOptions.map((option, index) => (
                      <TableRow key={index} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white font-medium">${option.strike}</TableCell>
                        <TableCell className="text-green-400 font-mono text-lg">${option.premium}</TableCell>
                        <TableCell>
                          <Badge className={getWheelSuitabilityBadge(option.wheelSuitability)}>
                            {option.wheelSuitability.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 font-mono">{option.probabilityITM}%</TableCell>
                        <TableCell className="text-green-400 font-mono font-semibold">{option.annualizedReturn}%</TableCell>
                        <TableCell className="w-24">
                          <VolumeDistributionBar distribution={option.volumeDistribution} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-blue-400 border-blue-400">
                            Sell Put
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="puts" className="mt-4">
              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                <h4 className="text-white font-semibold mb-2 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Put Options Activity
                </h4>
                <p className="text-slate-300 text-sm">
                  All put-related activity including protective puts, cash-secured puts, and speculative buying.
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Strike</TableHead>
                      <TableHead className="text-slate-300">Volume</TableHead>
                      <TableHead className="text-slate-300">OI</TableHead>
                      <TableHead className="text-slate-300">Premium</TableHead>
                      <TableHead className="text-slate-300">Volume Timing</TableHead>
                      <TableHead className="text-slate-300">Strategy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {putOptions.map((option, index) => (
                      <TableRow key={index} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white font-medium">${option.strike}</TableCell>
                        <TableCell className="text-slate-300 font-mono">{option.volume.toLocaleString()}</TableCell>
                        <TableCell className="text-slate-300 font-mono">{option.oi.toLocaleString()}</TableCell>
                        <TableCell className="text-green-400 font-mono">${option.premium}</TableCell>
                        <TableCell className="w-24">
                          <VolumeDistributionBar distribution={option.volumeDistribution} />
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">{option.context}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                📝 Trading Notes
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                <li>High call activity suggests bullish sentiment through Friday expiration</li>
                <li>Put writing at ATM strikes indicates institutional support</li>
                <li>Volume concentrated during regular hours suggests institutional flow</li>
              </ul>
            </div>
            
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                🎯 Wheel Strategy Tips
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                <li>Focus on strikes with 15-45% ITM probability for optimal risk/reward</li>
                <li>Premium above 1% weekly return indicates good wheel candidates</li>
                <li>Monitor volume timing - regular hours activity is more reliable</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default OptionsActivity;
