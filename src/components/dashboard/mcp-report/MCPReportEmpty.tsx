
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw } from 'lucide-react';

interface MCPReportEmptyProps {
  symbol: string;
  isRefreshing: boolean;
  isRealTimeLoading: boolean;
  onRefresh: () => void;
}

const MCPReportEmpty: React.FC<MCPReportEmptyProps> = ({
  symbol,
  isRefreshing,
  isRealTimeLoading,
  onRefresh
}) => {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>MCP Report for {symbol}</span>
            <Button 
              onClick={onRefresh}
              disabled={isRefreshing || isRealTimeLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isRealTimeLoading) ? 'animate-spin' : ''}`} />
              {isRefreshing || isRealTimeLoading ? 'Loading...' : 'Generate Report'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Report Available</h3>
          <p className="text-slate-400 mb-4">Generate your first MCP Wheel Strategy Report for {symbol}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPReportEmpty;
