
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3, Volume2 } from 'lucide-react';
import { WeeklySentimentData } from '@/hooks/useHistoricalOptionsActivity';

interface WeeklySentimentCardProps {
  weeklySentiment: WeeklySentimentData[];
  symbol: string;
}

const WeeklySentimentCard: React.FC<WeeklySentimentCardProps> = ({ weeklySentiment, symbol }) => {
  if (!weeklySentiment || weeklySentiment.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <BarChart3 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-300">No historical sentiment data available</p>
            <p className="text-slate-500 text-sm">Generate reports to build sentiment history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentWeek = weeklySentiment[0];
  const previousWeek = weeklySentiment[1];

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-600 text-white';
      case 'bearish':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getWeekStatus = (weekStart: string) => {
    const start = new Date(weekStart);
    const now = new Date();
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 6);

    if (now >= start && now <= weekEnd) {
      return 'Current Week';
    } else if (now > weekEnd) {
      return 'Past Week';
    } else {
      return 'Future Week';
    }
  };

  const calculateTrend = () => {
    if (!previousWeek) return null;

    const currentStrength = currentWeek.sentimentStrength;
    const previousStrength = previousWeek.sentimentStrength;
    const change = currentStrength - previousStrength;

    if (Math.abs(change) < 5) return { type: 'stable', change: 0 };
    return {
      type: change > 0 ? 'improving' : 'declining',
      change: Math.abs(change)
    };
  };

  const trend = calculateTrend();

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-400" />
          📈 Weekly Sentiment Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Week Highlight */}
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-white flex items-center">
                {getSentimentIcon(currentWeek.dominantSentiment)}
                <span className="ml-2">{getWeekStatus(currentWeek.weekStart)}</span>
              </h4>
              <p className="text-slate-400 text-sm">
                {formatWeekRange(currentWeek.weekStart, currentWeek.weekEnd)}
              </p>
            </div>
            <div className="text-right">
              <Badge className={getSentimentColor(currentWeek.dominantSentiment)}>
                {currentWeek.dominantSentiment.toUpperCase()}
              </Badge>
              <p className="text-slate-300 text-sm mt-1">
                {currentWeek.sentimentStrength}% confidence
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{currentWeek.bullishCount}</div>
              <div className="text-slate-400">Bullish Signals</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{currentWeek.bearishCount}</div>
              <div className="text-slate-400">Bearish Signals</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{currentWeek.totalUnusualCount}</div>
              <div className="text-slate-400">Total Activity</div>
            </div>
          </div>

          {trend && (
            <div className="mt-3 pt-3 border-t border-slate-600">
              <div className="flex items-center text-sm">
                {trend.type === 'improving' ? (
                  <TrendingUp className="h-4 w-4 text-green-400 mr-2" />
                ) : trend.type === 'declining' ? (
                  <TrendingDown className="h-4 w-4 text-red-400 mr-2" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-400 mr-2" />
                )}
                <span className="text-slate-300">
                  {trend.type === 'stable' 
                    ? 'Sentiment stable vs last week'
                    : `Sentiment ${trend.type} by ${trend.change}% vs last week`
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Historical Weeks */}
        <div className="space-y-2">
          <h5 className="font-medium text-slate-300 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Recent History
          </h5>
          
          {weeklySentiment.slice(1, 4).map((week, index) => (
            <div key={week.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
              <div className="flex items-center">
                {getSentimentIcon(week.dominantSentiment)}
                <div className="ml-3">
                  <div className="text-sm text-white">
                    {formatWeekRange(week.weekStart, week.weekEnd)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {week.totalUnusualCount} activities detected
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right text-xs">
                  <div className="text-green-400">{week.bullishCount}B</div>
                  <div className="text-red-400">{week.bearishCount}B</div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    week.dominantSentiment === 'bullish' 
                      ? 'border-green-400 text-green-400' 
                      : week.dominantSentiment === 'bearish'
                      ? 'border-red-400 text-red-400'
                      : 'border-gray-400 text-gray-400'
                  }`}
                >
                  {week.sentimentStrength}%
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Key Strikes for Current Week */}
        {currentWeek.keyStrikes && currentWeek.keyStrikes.length > 0 && (
          <div className="p-3 bg-slate-700/30 rounded">
            <h5 className="font-medium text-slate-300 mb-2 flex items-center">
              <Volume2 className="h-4 w-4 mr-2" />
              Most Active Strikes This Week
            </h5>
            <div className="flex flex-wrap gap-2">
              {currentWeek.keyStrikes.slice(0, 5).map((strike, index) => (
                <Badge key={index} variant="outline" className="text-blue-400 border-blue-400">
                  ${strike.strike} ({strike.volume.toLocaleString()})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklySentimentCard;
