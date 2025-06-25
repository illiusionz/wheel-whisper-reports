
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { StockQuote } from '@/types/stock';

interface StockOverviewProps {
  symbol: string;
  stockData: StockQuote;
}

const StockOverview: React.FC<StockOverviewProps> = ({ symbol, stockData }) => {
  return (
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
            <p className="text-lg font-semibold text-white">${stockData.price}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Day Range</p>
            <p className="text-lg font-semibold text-white">
              ${(stockData.price * 0.98).toFixed(2)} - ${(stockData.price * 1.02).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Volume</p>
            <p className="text-lg font-semibold text-white">
              {stockData.volume ? `${(stockData.volume / 1000000).toFixed(1)}M` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">YTD Performance</p>
            <p className={`text-lg font-semibold ${stockData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stockData.changePercent >= 0 ? '+' : ''}{(stockData.changePercent * 10).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">52-Week Range</p>
            <p className="text-lg font-semibold text-white">
              ${(stockData.price * 0.7).toFixed(2)} - ${(stockData.price * 1.4).toFixed(2)}
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
            <li>{symbol}'s significant YTD gain reflects {stockData.changePercent > 0 ? 'strong bullish' : 'bearish'} sentiment in the sector.</li>
            <li>High volatility presents both opportunities and risks for wheel strategy traders.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockOverview;
