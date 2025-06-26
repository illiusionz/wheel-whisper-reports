
import { useState, useEffect, useCallback } from 'react';
import { MarketHoursService } from '@/services/market/MarketHoursService';

interface UseMarketAwareRefreshOptions {
  respectMarketHours: boolean;
  refreshInterval: number;
  onRefresh: () => void;
  enableAutoRefresh: boolean;
  symbol?: string;
  symbols?: string[];
}

export const useMarketAwareRefresh = (options: UseMarketAwareRefreshOptions) => {
  const { respectMarketHours, refreshInterval, onRefresh, enableAutoRefresh, symbol, symbols } = options;
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'pre-market' | 'after-hours'>('closed');
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(enableAutoRefresh);

  // Update market status
  useEffect(() => {
    const updateMarketStatus = () => {
      const marketHours = MarketHoursService.getCurrentMarketHours();
      setMarketStatus(marketHours.currentStatus);
    };

    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const shouldMakeApiCall = useCallback(() => {
    return !respectMarketHours || MarketHoursService.shouldMakeApiCall();
  }, [respectMarketHours]);

  const startAutoRefresh = useCallback(() => {
    if (!shouldMakeApiCall() && respectMarketHours) {
      console.log('Auto-refresh disabled - market is closed');
      setIsAutoRefreshActive(false);
      return null;
    }

    setIsAutoRefreshActive(true);
    
    // Add jitter to prevent synchronized requests
    const jitteredInterval = refreshInterval + (Math.random() * 5000);
    const intervalId = setInterval(() => {
      if (shouldMakeApiCall()) {
        onRefresh();
      }
    }, jitteredInterval);
    
    console.log(`Auto-refresh started for ${symbol || symbols?.join(', ')} every ~${Math.round(jitteredInterval/1000)}s`);
    return intervalId;
  }, [shouldMakeApiCall, respectMarketHours, refreshInterval, onRefresh, symbol, symbols]);

  const stopAutoRefresh = useCallback((intervalId: NodeJS.Timeout | null) => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    setIsAutoRefreshActive(false);
    
    console.log(`Auto-refresh stopped for ${symbol || symbols?.join(', ')}`);
  }, [symbol, symbols]);

  return {
    marketStatus,
    isAutoRefreshActive,
    shouldMakeApiCall,
    startAutoRefresh,
    stopAutoRefresh
  };
};
