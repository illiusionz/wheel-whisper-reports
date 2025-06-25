
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface MCPReportControlsProps {
  isRefreshing: boolean;
  isRealTimeLoading: boolean;
  onManualRefresh: () => void;
}

const MCPReportControls: React.FC<MCPReportControlsProps> = ({
  isRefreshing,
  isRealTimeLoading,
  onManualRefresh
}) => {
  return (
    <div className="flex gap-2">
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
