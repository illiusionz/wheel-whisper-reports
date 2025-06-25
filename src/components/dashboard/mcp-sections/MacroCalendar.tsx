
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface MacroCalendarProps {
  symbol: string;
}

const MacroCalendar: React.FC<MacroCalendarProps> = ({ symbol }) => {
  return (
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
  );
};

export default MacroCalendar;
