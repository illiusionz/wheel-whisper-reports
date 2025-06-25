
import React from 'react';
import { Clock } from 'lucide-react';

interface MCPReportHeaderProps {
  symbol: string;
  lastUpdated: Date | null;
}

const MCPReportHeader: React.FC<MCPReportHeaderProps> = ({ symbol, lastUpdated }) => {
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="px-6 pt-6 pb-4 border-b border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            MCP Report - {symbol}
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
            <Clock className="h-4 w-4" />
            <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPReportHeader;
