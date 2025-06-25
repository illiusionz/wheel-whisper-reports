
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
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
}

const OptionsActivity: React.FC<OptionsActivityProps> = ({ stockData }) => {
  const generateOptionsData = (data: StockQuote): OptionData[] => {
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

  const getSentimentBadge = (sentiment: string) => {
    const colors = {
      'Bullish': 'bg-green-600 text-white',
      'Bearish': 'bg-red-600 text-white',
      'Neutral': 'bg-yellow-600 text-black'
    };
    return colors[sentiment as keyof typeof colors] || 'bg-gray-600 text-white';
  };

  const optionsData = generateOptionsData(stockData);

  return (
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
  );
};

export default OptionsActivity;
