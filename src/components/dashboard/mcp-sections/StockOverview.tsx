
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { StockQuote } from '@/types/stock';
import HybridAIInsightCard from '@/components/ai/HybridAIInsightCard';

interface StockOverviewProps {
  symbol: string;
  stockData: StockQuote;
}

const StockOverview: React.FC<StockOverviewProps> = ({ symbol, stockData }) => {
  const isPositive = stockData.change >= 0;
  
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stock Overview - {stockData.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-slate-300 text-sm">Price</span>
              </div>
              <p className="text-white text-xl font-bold">${stockData.price}</p>
            </div>
            
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className="text-slate-300 text-sm">Change</span>
              </div>
              <p className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                ${stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
              </p>
            </div>
            
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span className="text-slate-300 text-sm">Volume</span>
              </div>
              <p className="text-white text-xl font-bold">
                {stockData.volume ? (stockData.volume / 1000000).toFixed(1) + 'M' : 'N/A'}
              </p>
            </div>
            
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-purple-400" />
                <span className="text-slate-300 text-sm">Market Cap</span>
              </div>
              <p className="text-white text-xl font-bold">
                {stockData.marketCap ? 
                  '$' + (stockData.marketCap / 1000000000).toFixed(1) + 'B' : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hybrid AI Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HybridAIInsightCard
          symbol={symbol}
          analysisType="technical"
          data={stockData}
          title="Technical Analysis (Claude)"
        />
        
        <HybridAIInsightCard
          symbol={symbol}
          analysisType="sentiment"
          data={stockData}
          title="Market Sentiment (Perplexity)"
          requiresRealTime={true}
        />
      </div>
    </div>
  );
};

export default StockOverview;
