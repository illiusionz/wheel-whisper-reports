
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Clock, RefreshCw, Calendar, Zap } from 'lucide-react';

interface SchedulePanelProps {
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

const SchedulePanel: React.FC<SchedulePanelProps> = ({ onRefreshAll, isRefreshing }) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [weeklyUpdates, setWeeklyUpdates] = useState(true);

  // Calculate next update time (Friday 6:00 AM ET for weekly)
  const getNextUpdateTime = () => {
    const now = new Date();
    const nextFriday = new Date();
    nextFriday.setDate(now.getDate() + ((5 + 7 - now.getDay()) % 7));
    nextFriday.setHours(6, 0, 0, 0);
    
    if (now.getDay() === 5 && now.getHours() < 6) {
      // If it's Friday before 6 AM, use today
      nextFriday.setDate(now.getDate());
    }
    
    return nextFriday;
  };

  const nextUpdate = getNextUpdateTime();
  const timeUntilUpdate = nextUpdate.getTime() - new Date().getTime();
  const daysUntil = Math.floor(timeUntilUpdate / (1000 * 60 * 60 * 24));
  const hoursUntil = Math.floor((timeUntilUpdate % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-400" />
            Report Schedule
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage when your MCP reports are generated and delivered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
            <div>
              <h3 className="font-semibold text-white">Next Scheduled Update</h3>
              <p className="text-sm text-slate-400">
                {nextUpdate.toLocaleDateString()} at {nextUpdate.toLocaleTimeString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {daysUntil > 0 ? `${daysUntil}d ` : ''}{hoursUntil}h remaining
              </p>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-400">
              <Calendar className="w-3 h-3 mr-1" />
              Scheduled
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-refresh" className="text-white">Auto-refresh reports</Label>
              <p className="text-sm text-slate-400">
                Automatically generate new reports on schedule
              </p>
            </div>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="weekly-updates" className="text-white">Weekly updates</Label>
              <p className="text-sm text-slate-400">
                Generate reports every Friday at 6:00 AM ET
              </p>
            </div>
            <Switch
              id="weekly-updates"
              checked={weeklyUpdates}
              onCheckedChange={setWeeklyUpdates}
            />
          </div>

          <Button 
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing All Reports...' : 'Refresh All Reports Now'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
            <Calendar className="mr-2 h-4 w-4" />
            View Report History
          </Button>
          <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Force Refresh Single Stock
          </Button>
          <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
            <Clock className="mr-2 h-4 w-4" />
            Schedule Custom Report
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700/50">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-sm font-semibold text-white">Pro Tip</p>
              <p className="text-xs text-slate-300">
                Reports are generated before market open for optimal wheel strategy execution
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulePanel;
