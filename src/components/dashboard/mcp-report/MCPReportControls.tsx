
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Pause, Play } from 'lucide-react';

interface MCPReportControlsProps {
  isAutoRefreshActive: boolean;
  isRefreshing: boolean;
  isRealTimeLoading: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
}

const MCPReportControls: React.FC<MCPReportControlsProps> = ({
  isAutoRefreshActive,
  isRefreshing,
  isRealTimeLoading,
  onToggleAutoRefresh,
  onManualRefresh
}) => {
  return (
    <div className="flex gap-2">
      <Button 
        onClick={onToggleAutoRefresh}
        variant="outline"
        size="sm"
        className="border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        {isAutoRefreshActive ? (
          <>
            <Pause className="h-4 w-4 mr-2" />
            Pause Auto-Refresh
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Start Auto-Refresh
          </>
        )}
      </Button>
      <Button 
        onClick={onManualRefresh}
        disabled={isRefreshing || isRealTimeLoading}
        className="bg-green-600 hover:bg-green-700"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isRealTimeLoading) ? 'animate-spin' : ''}`} />
        {isRefreshing || isRealTimeLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );
};

export default MCPReportControls;
