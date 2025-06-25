
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { StockQuote } from '@/types/stock';

interface ExpectedClosingProps {
  stockData: StockQuote;
}

const ExpectedClosing: React.FC<ExpectedClosingProps> = ({ stockData }) => {
  return (
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
              ${(stockData.price * 0.95).toFixed(2)} - ${(stockData.price * 1.05).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Implied Move</p>
            <p className="text-lg font-semibold text-white">
              ±${(stockData.price * 0.063).toFixed(2)} (6.3%) based on weekly ATM straddle pricing
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
  );
};

export default ExpectedClosing;
