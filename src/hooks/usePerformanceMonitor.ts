
import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  apiCallCount: number;
  cacheHitRate: number;
  memoryUsage: number;
  lastUpdate: Date;
}

export const usePerformanceMonitor = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    apiCallCount: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    lastUpdate: new Date()
  });

  const renderStartTime = useRef<number>();
  const apiCallCount = useRef(0);
  const cacheHits = useRef(0);
  const cacheMisses = useRef(0);

  // Start render timing
  const startRenderTiming = () => {
    renderStartTime.current = performance.now();
  };

  // End render timing
  const endRenderTiming = () => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({
        ...prev,
        renderTime,
        lastUpdate: new Date()
      }));
    }
  };

  // Track API calls
  const trackApiCall = () => {
    apiCallCount.current++;
    setMetrics(prev => ({
      ...prev,
      apiCallCount: apiCallCount.current,
      lastUpdate: new Date()
    }));
  };

  // Track cache hits/misses
  const trackCacheHit = () => {
    cacheHits.current++;
    updateCacheHitRate();
  };

  const trackCacheMiss = () => {
    cacheMisses.current++;
    updateCacheHitRate();
  };

  const updateCacheHitRate = () => {
    const total = cacheHits.current + cacheMisses.current;
    const hitRate = total > 0 ? (cacheHits.current / total) * 100 : 0;
    
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: hitRate,
      lastUpdate: new Date()
    }));
  };

  // Monitor memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memInfo.usedJSHeapSize / 1024 / 1024, // MB
          lastUpdate: new Date()
        }));
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metrics for ${componentName}:`, metrics);
    }
  }, [componentName, metrics]);

  return {
    metrics,
    startRenderTiming,
    endRenderTiming,
    trackApiCall,
    trackCacheHit,
    trackCacheMiss
  };
};
