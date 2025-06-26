
import { useEffect } from 'react';

interface UseVisibilityHandlerOptions {
  isAutoRefreshActive: boolean;
  enableAutoRefresh: boolean;
  startAutoRefresh: () => NodeJS.Timeout | null;
  stopAutoRefresh: (intervalId: NodeJS.Timeout | null) => void;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export const useVisibilityHandler = (options: UseVisibilityHandlerOptions) => {
  const { isAutoRefreshActive, enableAutoRefresh, startAutoRefresh, stopAutoRefresh, intervalRef } = options;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoRefresh(intervalRef.current);
        intervalRef.current = null;
      } else if (enableAutoRefresh && isAutoRefreshActive) {
        intervalRef.current = startAutoRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableAutoRefresh, isAutoRefreshActive, startAutoRefresh, stopAutoRefresh, intervalRef]);
};
