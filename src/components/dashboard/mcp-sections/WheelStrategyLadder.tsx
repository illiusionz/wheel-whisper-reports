
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingDown, Calculator } from 'lucide-react';
import { StockQuote } from '@/types/stock';
import HybridAIInsightCard from '@/components/ai/HybridAIInsightCard';

interface WheelStrategyLadderProps {
  stockData: StockQuote;
}

const WheelStrategyLadder: React.FC<WheelStrategyLadderProps> = ({ stockData }) => {
  // Generate sample wheel strategy strikes based on current price
  const currentPrice = stockData.price;
  const strikes = [
    { strike: Math.round(currentPrice * 0.95), delta: 0.25, premium: 1.20, prob: 82 },
    { strike: Math.round(currentPrice * 0.90), delta: 0.15, premium: 0.80, prob: 88 },
    { strike: Math.round(currentPrice * 0.85), delta: 0.10, premium: 0.45, prob: 92 },
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            Wheel Strategy Ladder - {stockData.symbol}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {strikes.map((strike, index) => (
              <div key={index} className="bg-slate-700 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-slate-300 text-sm">Strike</p>
                    <p className="text-white font-bold">${strike.strike}</p>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">Delta</p>
                    <p className="text-white font-bold">{strike.delta.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">Premium</p>
                    <p className="text-green-400 font-bold">${strike.premium}</p>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">Prob of Profit</p>
                    <p className="text-blue-400 font-bold">{strike.prob}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {((strike.premium / strike.strike) * 100 * 12).toFixed(1)}% Annual
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hybrid AI Strategy Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HybridAIInsightCard
          symbol={stockData.symbol}
          analysisType="options"
          data={{ stockData, strikes }}
          title="Options Strategy (Claude)"
        />
        
        <HybridAIInsightCard
          symbol={stockData.symbol}
          analysisType="risk"
          data={{ stockData, strikes }}
          title="Risk Assessment (Claude)"
        />
      </div>
    </div>
  );
};

export default WheelStrategyLadder;
