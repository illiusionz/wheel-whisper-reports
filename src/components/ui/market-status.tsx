
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MarketHoursService } from '@/services/market/MarketHoursService';
import { Clock } from 'lucide-react';

interface MarketStatusProps {
  showMessage?: boolean;
  className?: string;
}

export const MarketStatus: React.FC<MarketStatusProps> = ({ 
  showMessage = false, 
  className = "" 
}) => {
  const marketHours = MarketHoursService.getCurrentMarketHours();
  const message = MarketHoursService.getMarketStatusMessage();

  const getStatusColor = () => {
    switch (marketHours.currentStatus) {
      case 'open':
        return 'bg-green-600 text-white';
      case 'pre-market':
      case 'after-hours':
        return 'bg-yellow-600 text-white';
      case 'closed':
      default:
        return 'bg-red-600 text-white';
    }
  };

  const getStatusText = () => {
    switch (marketHours.currentStatus) {
      case 'open':
        return 'OPEN';
      case 'pre-market':
        return 'PRE-MARKET';
      case 'after-hours':
        return 'AFTER-HOURS';
      case 'closed':
      default:
        return 'CLOSED';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge className={getStatusColor()}>
        <Clock className="h-3 w-3 mr-1" />
        {getStatusText()}
      </Badge>
      {showMessage && (
        <span className="text-sm text-slate-400">{message}</span>
      )}
    </div>
  );
};
