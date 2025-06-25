
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface MCPReportHeaderProps {
  symbol: string;
  lastUpdated: Date | null;
  isAutoRefreshActive: boolean;
}

const MCPReportHeader: React.FC<MCPReportHeaderProps> = ({
  symbol,
  lastUpdated,
  isAutoRefreshActive
}) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-white text-2xl">
            MCP Wheel Strategy Report for {symbol}
          </CardTitle>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-slate-400">
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </p>
            {isAutoRefreshActive && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Live
              </div>
            )}
          </div>
        </div>
      </div>
    </CardHeader>
  );
};

export default MCPReportHeader;
