
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase } from 'lucide-react';
import { StockQuote } from '@/types/stock';

interface WheelStrategyLadderProps {
  stockData: StockQuote;
}

interface WheelOption {
  strike: number;
  expiry: string;
  premium: number;
  delta: number;
  iv: string;
  sentiment: string;
}

interface WheelData {
  csp: WheelOption[];
  cc: WheelOption[];
}

const WheelStrategyLadder: React.FC<WheelStrategyLadderProps> = ({ stockData }) => {
  const generateWheelData = (data: StockQuote): WheelData => {
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

  const wheelStrategyData = generateWheelData(stockData);

  return (
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
              {wheelStrategyData.csp.map((option, index) => (
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
              {wheelStrategyData.cc.map((option, index) => (
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
  );
};

export default WheelStrategyLadder;
