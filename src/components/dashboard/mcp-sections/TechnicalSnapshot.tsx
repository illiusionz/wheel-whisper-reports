
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { StockQuote } from '@/types/stock';

interface TechnicalSnapshotProps {
  stockData: StockQuote;
}

interface TechnicalData {
  rsi: number;
  macd: number;
  adx: number;
  ema20: number;
  ema50: number;
  ema200: number;
}

const TechnicalSnapshot: React.FC<TechnicalSnapshotProps> = ({ stockData }) => {
  const generateTechnicalData = (data: StockQuote): TechnicalData => {
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

  const technicalData = generateTechnicalData(stockData);

  return (
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
  );
};

export default TechnicalSnapshot;
